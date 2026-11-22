import { matchBrackets, parseParts, type MixedNode } from "./parse";

/** What a group becomes when no `createGroup` option is given. */
export interface WordhugRichTextGroup<N> {
  type: "group";
  children: (N | WordhugRichTextGroup<N>)[];
}

/** A field name of any node type in `N`, so a field only text nodes have, like `text`, is allowed. */
type FieldOf<N> = N extends unknown ? Extract<keyof N, string> : never;

export interface WordhugRichTextOptions<N> {
  /** The field a text node keeps its text in. Default: `"text"`. */
  textField?: FieldOf<N>;
  /**
   * A field to keep unique, such as Sanity's `"_key"`. When a node is cut in
   * two, the pieces get `abc`, `abc-1`, `abc-2`…, and each group gets its
   * `key` (`wordhug-0`, `wordhug-1`…). Default: none.
   */
  keyField?: FieldOf<N>;
  /**
   * Which nodes are text. Every other node (a link node, a mention, an image)
   * is kept whole: a group can contain it, but brackets inside it are not read.
   * Default: nodes with a string in `textField` that aren't inline code
   * (a `code` mark, `code: true`, or Lexical's code format).
   */
  isText?: (node: N) => boolean;
  /**
   * Which text nodes are part of a link, for formats that store links as marks
   * (Sanity, Storyblok, TipTap). A group that would cut a link in two keeps its
   * brackets as text instead, and `onWarning` is called. Default: none.
   */
  isLink?: (node: N) => boolean;
  /** Called with a message when a group's brackets are kept as text. */
  onWarning?: (message: string) => void;
  /** Read the text of a text node, for formats that don't keep it in one field. */
  getText?: (node: N) => string | undefined;
  /** A copy of a text node with other text, for formats that don't keep it in one field. */
  setText?: (node: N, text: string) => N;
}

export interface WordhugRichTextGroupOption<N, G> {
  /**
   * What a group becomes. `children` are your nodes and any groups inside
   * this one, in order. `key` is unique within one call (`wordhug-0`,
   * `wordhug-1`…), and `depth` is 0 for a group that isn't inside another.
   * Return an array to put several nodes in the group's place, for formats
   * that can't nest, such as the same nodes with a mark named after `key`.
   * Default: `{ type: "group", children }`.
   */
  createGroup: (children: (N | object)[], info: { key: string; depth: number }) => G | (N | G)[];
}

/**
 * Find `[bracketed phrases]` in one paragraph of rich text stored as JSON,
 * such as the content of a ProseMirror, TipTap or Lexical paragraph, a
 * Contentful paragraph or the children of a Sanity block, and return the
 * paragraph's nodes with each phrase as a group.
 *
 * The text of all text nodes is read as one sentence, so a group can start in
 * a bold node and end in a plain one. Nodes are cut at the brackets and every
 * piece keeps its formatting. Nodes that aren't text, and inline code, are
 * kept whole. Whitespace is kept as written, except at a group's edges.
 *
 * Nodes that don't change are returned as they are, not copied; without
 * groups, the whole list comes back unchanged.
 */
// The createGroup overload comes first, so TypeScript types its parameters from it.
export function wordhugRichText<N, G>(
  nodes: readonly N[],
  options: WordhugRichTextOptions<N> & WordhugRichTextGroupOption<N, G>,
): (N | G)[];
export function wordhugRichText<N>(
  nodes: readonly N[],
  options?: WordhugRichTextOptions<N>,
): (N | WordhugRichTextGroup<N>)[];
export function wordhugRichText<N, G>(
  nodes: readonly N[],
  options: WordhugRichTextOptions<N> & Partial<WordhugRichTextGroupOption<N, G>> = {},
): (N | G)[] {
  const field: string = options.textField ?? "text";
  const keyField: string | undefined = options.keyField;
  const getText =
    options.getText ??
    ((node: N) => {
      const value = (node as Record<string, unknown> | null)?.[field];
      return typeof value === "string" ? value : undefined;
    });
  const setText = options.setText ?? ((node: N, text: string) => ({ ...node, [field]: text }) as N);
  const isText = options.isText ?? ((node: N) => getText(node) !== undefined && !isInlineCode(node));
  const createGroup =
    options.createGroup ?? ((children: (N | object)[]) => ({ type: "group", children }) as unknown as G);

  // The text nodes, with where each one's text starts in the paragraph's text.
  const texts: { index: number; text: string; start: number }[] = [];
  let joined = "";
  nodes.forEach((node, index) => {
    const text = isText(node) ? getText(node) : undefined;
    if (text === undefined) return;
    texts.push({ index, text, start: joined.length });
    joined += text;
  });
  // Most paragraphs have no brackets: return them before doing anything else.
  if (!joined.includes("[") && !joined.includes("]")) return [...nodes];

  const linkKept = options.isLink ? keepAroundLinks(nodes, texts, joined, options.isLink, options.onWarning) : [];

  // A backslash at the end of one node escapes a bracket at the start of the next,
  // as it would in one node. Parsing sees a marker between them, so the backslash
  // is dropped from the first node and the bracket kept as text like the others.
  const crossEscaped = new Set<number>();
  for (const { start, text } of texts) {
    const end = start + text.length;
    // As in `matchBrackets`, a backslash before a bracket always escapes it.
    if (text.endsWith("\\") && (joined[end] === "[" || joined[end] === "]")) crossEscaped.add(end);
  }
  const kept = crossEscaped.size > 0 ? [...linkKept, ...crossEscaped].sort((a, b) => a - b) : linkKept;

  // Each text node's text goes in after a marker saying which node it came from.
  // A bracket kept as text gets a backslash, which parsing turns back into the bracket.
  const parts: (string | Marker)[] = [];
  let next = 0;
  let k = 0;
  nodes.forEach((_, index) => {
    const entry = texts[next];
    if (entry?.index !== index) {
      parts.push({ whole: index });
      return;
    }
    next++;
    let text = "";
    let from = 0;
    const end = entry.start + entry.text.length;
    for (; k < kept.length && kept[k]! < end; k++) {
      const offset = kept[k]! - entry.start;
      text += `${entry.text.slice(from, offset)}\\`;
      from = offset;
    }
    text += entry.text.slice(from);
    if (crossEscaped.has(end)) text = text.slice(0, -1);
    parts.push({ start: index }, text);
  });

  const tree = parseParts(parts, { keepWhitespace: true });
  const hasEscape = crossEscaped.size > 0 || texts.some(({ text }) => ESCAPED_BRACKET.test(text));
  if (!hasEscape && !tree.some((node) => node.type === "group")) return [...nodes];

  let current = 0;
  let groups = 0;
  const pieces = new Map<number, number>();
  const originals = new Map(texts.map(({ index, text }) => [index, text]));

  const piece = (text: string): N => {
    const node = nodes[current]!;
    const part = pieces.get(current) ?? 0;
    pieces.set(current, part + 1);
    // A node whose text didn't change is kept as it is, not copied.
    if (part === 0 && text === originals.get(current)) return node;
    const copy = setText(node, text);
    if (!keyField || part === 0) return copy;
    const key = (node as Record<string, unknown>)[keyField];
    return typeof key === "string" ? ({ ...copy, [keyField]: `${key}-${part}` } as N) : copy;
  };

  const render = (list: MixedNode<Marker>[], depth: number): (N | G)[] => {
    const out: (N | G)[] = [];
    // Inside a group, trim the first and last text; markers around them don't count.
    const content = list.flatMap((node, i) => (node.type === "item" && "start" in node.value ? [] : [i]));
    const first = depth > 0 ? content[0] : undefined;
    const last = depth > 0 ? content[content.length - 1] : undefined;

    list.forEach((node, i) => {
      if (node.type === "text") {
        let value = node.value;
        if (i === first) value = value.trimStart();
        if (i === last) value = value.trimEnd();
        if (value) out.push(piece(value));
      } else if (node.type === "item") {
        if ("start" in node.value) current = node.value.start;
        else out.push(nodes[node.value.whole]!);
      } else {
        const key = `wordhug-${groups++}`;
        const children = render(node.children, depth + 1);
        if (children.length === 0) return;
        const made = createGroup(children as (N | object)[], { key, depth });
        if (Array.isArray(made)) out.push(...made);
        else out.push(withKey(made, keyField, key));
      }
    });
    return out;
  };

  return render(tree, 0);
}

/** A node's place in the list: the start of a text node's text, or a node kept whole. */
type Marker = { start: number } | { whole: number };

const ESCAPED_BRACKET = /\\[[\]]/;

function withKey<T>(node: T, keyField: string | undefined, key: string): T {
  return keyField && typeof node === "object" && node !== null && !(keyField in node)
    ? { ...node, [keyField]: key }
    : node;
}

/** Inline code in the common formats: a `code` mark, `code: true`, or Lexical's code format bit. */
function isInlineCode(node: unknown): boolean {
  if (typeof node !== "object" || node === null) return false;
  const { code, marks, format, type } = node as Record<string, unknown>;
  if (code === true) return true;
  if (type === "text" && typeof format === "number" && (format & 16) !== 0) return true;
  return (
    Array.isArray(marks) &&
    marks.some((mark) => mark === "code" || (typeof mark === "object" && mark !== null && "type" in mark && mark.type === "code"))
  );
}

/**
 * The places in the paragraph's text of brackets that must stay text because
 * their group would cut a link in two: the text on both sides of the bracket
 * is part of one link. Pairs are matched again without them until none is left.
 */
function keepAroundLinks<N>(
  nodes: readonly N[],
  texts: { index: number; text: string; start: number }[],
  joined: string,
  isLink: (node: N) => boolean,
  onWarning: ((message: string) => void) | undefined,
): number[] {
  // Which text node holds a place in the text: texts are in order, so search by halves.
  const textAt = (i: number): number => {
    let low = 0;
    let high = texts.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const entry = texts[mid]!;
      if (i < entry.start) high = mid - 1;
      else if (i >= entry.start + entry.text.length) low = mid + 1;
      else return mid;
    }
    return -1;
  };
  const links = texts.map((entry) => isLink(nodes[entry.index]!));
  const insideLink = (i: number): boolean => {
    const before = textAt(i - 1);
    const after = textAt(i + 1);
    if (before < 0 || after < 0 || !links[before] || !links[after]) return false;
    // The same link only if no node that isn't text lies between them.
    return texts[after]!.index - texts[before]!.index === after - before;
  };

  const kept = new Set<number>();
  for (;;) {
    const blocked = [...matchBrackets(joined, kept)].filter(([open, close]) => insideLink(open) || insideLink(close));
    if (blocked.length === 0) return [...kept].sort((a, b) => a - b);
    for (const [open, close] of blocked) {
      kept.add(open);
      kept.add(close);
      onWarning?.(
        `wordhug: the group ${JSON.stringify(joined.slice(open, close + 1))} would cut a link in two, ` +
          "so its brackets are kept as text. Put the brackets around the whole link, or outside it.",
      );
    }
  }
}
