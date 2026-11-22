import { matchBrackets } from "./parse";

/**
 * Inline elements that only add formatting, so one can be split in two
 * without changing how the text reads: `<em>a b</em>` and `<em>a </em><em>b</em>`
 * look the same. Links, code and anything else are never split.
 */
export const SPLITTABLE = new Set([
  "b", "strong", "i", "em", "u", "s", "del", "ins", "mark", "small", "sub", "sup", "span",
]);

/** How to read and rebuild one kind of tree: hast for rehype, parsed markup for `wordhugMarkup`. */
export interface TreeOps<N, E extends N> {
  /** The text of a text node, or `undefined` for anything else. */
  text(node: N): string | undefined;
  makeText(value: string): N;
  /** The node as an element whose content is read for brackets, or `undefined`. */
  element(node: N): E | undefined;
  children(element: E): N[];
  setChildren(element: E, children: N[]): void;
  /** A copy of the element (same tag and attributes) with other children. */
  clone(element: E, children: N[]): E;
  /** Whether the element can be split: a formatting element with no `id` and a closing tag. */
  splittable(element: E): boolean;
  /** Tag name, for warnings. */
  name(element: E): string;
}

/** A piece of text in a subtree, with the elements it sits in below the subtree's parent. */
interface Segment<N, E> {
  start: number;
  node: N;
  value: string;
  chain: E[];
}

/**
 * Make every group that starts in one element and ends in another fit in one
 * parent, so the usual parsing can wrap it. Formatting elements in the way are
 * split at the bracket and the bracket moves up:
 *
 * `<p><b>a [b</b> c]</p>` becomes `<p><b>a </b>[<b>b</b> c]</p>`, so both
 * brackets share a parent and the group can contain the second `<b>`. Text
 * keeps all its formatting, so it looks the same.
 *
 * When an element that can't be split (a link, an element with an `id`) is in
 * the way, the tree is left alone and `warn` is called.
 */
export function liftCrossingGroups<N, E extends N>(
  nodes: N[],
  ops: TreeOps<N, E>,
  warn?: (message: string) => void,
): N[] {
  let current = nodes;
  // Each lift moves a bracket up one or more levels, so this ends; the cap is only a safeguard.
  for (let lifts = 0; lifts < 10_000; lifts++) {
    const segments = flatten(current, ops);
    const joined = segments.map((segment) => segment.value).join("");
    const blocked: { group: string; element: E }[] = [];
    let lifted = false;

    for (const [open, close] of matchBrackets(joined)) {
      const a = segmentAt(segments, open);
      const b = segmentAt(segments, close);
      // Both brackets directly in this parent: the usual parsing handles it.
      if (a.chain.length === 0 && b.chain.length === 0) continue;
      // Both inside the same child: handled when that child is visited.
      if (a.chain.length > 0 && a.chain[0] === b.chain[0]) continue;

      const stuck = [...a.chain, ...b.chain].find((element) => !ops.splittable(element));
      if (stuck) {
        blocked.push({ group: joined.slice(open, close + 1), element: stuck });
        continue;
      }
      // The closing bracket first: it is further right, so the opening one's place doesn't move.
      if (b.chain.length > 0) current = lift(current, b, close - b.start, "]", ops);
      if (a.chain.length > 0) current = lift(current, a, open - a.start, "[", ops);
      lifted = true;
      break;
    }

    if (!lifted) {
      for (const { group, element } of blocked) {
        const tag = `<${ops.name(element)}>`;
        warn?.(
          `wordhug: the group ${JSON.stringify(group)} starts and ends in different elements, and ${tag} ` +
            `can't be split, so its brackets are kept as text. Put both brackets inside ${tag} or both outside it.`,
        );
      }
      break;
    }
  }

  for (const node of current) {
    const element = ops.element(node);
    if (element) ops.setChildren(element, liftCrossingGroups(ops.children(element), ops, warn));
  }
  return current;
}

/** All text below `nodes`, through elements whose content is read, in order. */
function flatten<N, E extends N>(nodes: N[], ops: TreeOps<N, E>): Segment<N, E>[] {
  const segments: Segment<N, E>[] = [];
  let start = 0;
  const walk = (list: N[], chain: E[]): void => {
    for (const node of list) {
      const value = ops.text(node);
      if (value !== undefined) {
        segments.push({ start, node, value, chain });
        start += value.length;
        continue;
      }
      const element = ops.element(node);
      if (element) walk(ops.children(element), [...chain, element]);
    }
  };
  walk(nodes, []);
  return segments;
}

function segmentAt<N, E>(segments: Segment<N, E>[], index: number): Segment<N, E> {
  return segments.find((segment) => index < segment.start + segment.value.length)!;
}

/** Split the elements around one bracket and put the bracket in `nodes` itself. */
function lift<N, E extends N>(
  nodes: N[],
  segment: Segment<N, E>,
  offset: number,
  bracket: string,
  ops: TreeOps<N, E>,
): N[] {
  const split = (element: E, depth: number): [E | null, E | null] => {
    const children = ops.children(element);
    const next = depth < segment.chain.length ? segment.chain[depth]! : segment.node;
    const index = children.indexOf(next);
    let left: N | null;
    let right: N | null;
    if (next === segment.node) {
      const before = segment.value.slice(0, offset);
      const after = segment.value.slice(offset + 1);
      left = before ? ops.makeText(before) : null;
      right = after ? ops.makeText(after) : null;
    } else {
      [left, right] = split(next as E, depth + 1);
    }
    const leftChildren = [...children.slice(0, index), ...(left ? [left] : [])];
    const rightChildren = [...(right ? [right] : []), ...children.slice(index + 1)];
    return [
      leftChildren.length > 0 ? ops.clone(element, leftChildren) : null,
      rightChildren.length > 0 ? ops.clone(element, rightChildren) : null,
    ];
  };

  const top = segment.chain[0]!;
  const index = nodes.indexOf(top);
  const [left, right] = split(top, 1);
  return [
    ...nodes.slice(0, index),
    ...(left ? [left] : []),
    ops.makeText(bracket),
    ...(right ? [right] : []),
    ...nodes.slice(index + 1),
  ];
}
