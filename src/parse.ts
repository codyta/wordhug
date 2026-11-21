export interface TextNode {
  type: "text";
  value: string;
}

export interface GroupNode {
  type: "group";
  children: Node[];
}

export type Node = TextNode | GroupNode;

/** Something other than text, such as a framework element, kept whole and in place. */
export interface ItemNode<T> {
  type: "item";
  value: T;
}

/** A group whose children can include items. */
export interface MixedGroupNode<T> {
  type: "group";
  children: MixedNode<T>[];
}

/** A node from {@link parseParts}: text, a group, or an item passed through untouched. */
export type MixedNode<T> = TextNode | ItemNode<T> | MixedGroupNode<T>;

const WHITESPACE = /[ \t\n\r\f\v]+/g;

/**
 * Parse text with square-bracket groups into a tree.
 *
 * - `[...]` becomes a group; groups can nest.
 * - Brackets without a partner (`a ] b`, `a [ b`) are kept as literal text.
 * - Runs of whitespace collapse to a single space, and whitespace at the start
 *   and end of the input and of each group is dropped.
 * - Text directly touching a bracket stays attached: `(see [p. 3])` keeps the
 *   `(see ` and `)` around the group without extra spaces.
 * - Empty groups (`[]`, `[  ]`) are removed.
 * - `\[` and `\]` are literal brackets: they never open or close a group, and
 *   the backslash is removed. A backslash before anything else is kept as is.
 */
export function parseBrackets(input: string): Node[] {
  return parseParts<never>([input]) as Node[];
}

/**
 * Like {@link parseBrackets}, for text with other things mixed in, such as
 * elements. Strings are joined and parsed as one text; every other part is
 * kept whole as an `item` node at its place, so a group can contain it but
 * brackets inside it are not read. Whitespace is collapsed and trimmed within
 * text only, so the space between a word and an item is kept.
 */
export function parseParts<T>(parts: readonly (string | T)[]): MixedNode<T>[] {
  // Each item stands in the joined text as one placeholder character. Items are
  // found by position, not by that character, so text containing it is safe.
  let input = "";
  const items = new Map<number, T>();
  for (const part of parts) {
    if (typeof part === "string") input += part;
    else {
      items.set(input.length, part);
      input += "\uFFFC";
    }
  }

  const pairs = matchBrackets(input);
  // An explicit stack instead of recursion, so deep nesting can't overflow the call stack.
  const stack: { nodes: MixedNode<T>[]; end: number }[] = [{ nodes: [], end: -1 }];
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    const top = stack[stack.length - 1]!;
    if (i === top.end) {
      pushText(top.nodes, input.slice(start, i));
      stack.pop();
      stack[stack.length - 1]!.nodes.push({ type: "group", children: normalize(top.nodes) });
      start = i + 1;
      continue;
    }
    if (items.has(i)) {
      pushText(top.nodes, input.slice(start, i));
      top.nodes.push({ type: "item", value: items.get(i)! });
      start = i + 1;
      continue;
    }
    const close = pairs.get(i);
    if (close !== undefined) {
      pushText(top.nodes, input.slice(start, i));
      stack.push({ nodes: [], end: close });
      start = i + 1;
    }
  }

  const root = stack[0]!.nodes;
  pushText(root, input.slice(start));
  return normalize(root);
}

const ESCAPED_BRACKET = /\\([[\]])/g;

function pushText<T>(nodes: MixedNode<T>[], value: string): void {
  if (value) nodes.push({ type: "text", value: value.replace(ESCAPED_BRACKET, "$1") });
}

/**
 * Map each matched `[` index to the index of its `]`. Unmatched and escaped
 * (`\[`, `\]`) brackets are left out.
 */
function matchBrackets(input: string): Map<number, number> {
  const pairs = new Map<number, number>();
  const open: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "\\" && (input[i + 1] === "[" || input[i + 1] === "]")) i++;
    else if (input[i] === "[") open.push(i);
    else if (input[i] === "]" && open.length > 0) pairs.set(open.pop()!, i);
  }
  return pairs;
}

function normalize<T>(nodes: MixedNode<T>[]): MixedNode<T>[] {
  const out: MixedNode<T>[] = [];
  for (const node of nodes) {
    if (node.type === "group") {
      if (node.children.length > 0) out.push(node);
      continue;
    }
    if (node.type === "item") {
      out.push(node);
      continue;
    }
    const last = out[out.length - 1];
    if (last?.type === "text") last.value += node.value;
    else out.push({ type: "text", value: node.value });
  }

  for (const node of out) {
    if (node.type === "text") node.value = node.value.replace(WHITESPACE, " ");
  }
  const first = out[0];
  if (first?.type === "text") first.value = first.value.trimStart();
  const last = out[out.length - 1];
  if (last?.type === "text") last.value = last.value.trimEnd();

  return out.filter((node) => node.type !== "text" || node.value !== "");
}
