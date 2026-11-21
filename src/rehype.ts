import { parseParts, type MixedNode } from "./parse";

export interface RehypeWordhugOptions {
  /** Tag name used to wrap each group. Defaults to `"span"`. */
  as?: string;
  /** Class for each group wrapper. */
  class?: string;
  /**
   * Style attribute for each group wrapper. Defaults to `"display: inline-block"`.
   * Pass `null` to leave styling entirely to `class`.
   */
  style?: string | null;
}

/**
 * The parts of a hast node this plugin reads. Kept structural, so the package
 * needs no `@types/hast`, and any hast or MDX tree fits.
 */
export interface HastNode {
  type: string;
  children?: HastNode[];
}

interface HastText extends HastNode {
  type: "text";
  value: string;
}

interface HastElement extends HastNode {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}

/** Elements whose text is code or not text at all, left exactly as they are. */
const SKIP = new Set(["code", "pre", "kbd", "samp", "script", "style", "textarea", "svg", "math"]);

const TAG_NAME = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const ESCAPED_BRACKET = /\\[[\]]/;

/**
 * A rehype plugin that wraps every `[bracketed phrase]` in the tree in an
 * element (an inline-block span by default), so it moves to the next line as
 * one unit. Use it after `remark-rehype`, so markdown links and references are
 * already resolved and only leftover brackets are read.
 *
 * Brackets are read within the text of one element: a group can contain inline
 * elements such as `<em>`, but can't start in one element and end in another.
 * Code, `<pre>`, `<script>`, `<style>` and similar elements are left alone.
 */
export default function rehypeWordhug(options: RehypeWordhugOptions = {}) {
  const { as = "span", class: className, style = "display: inline-block" } = options;
  if (!TAG_NAME.test(as)) throw new TypeError(`wordhug: invalid tag name ${JSON.stringify(as)}`);

  const properties: Record<string, unknown> = {};
  if (className) properties.className = className.split(/\s+/).filter(Boolean);
  if (style) properties.style = style;

  const toHast = (nodes: MixedNode<HastNode>[]): HastNode[] =>
    nodes.map((node): HastNode => {
      if (node.type === "text") return { type: "text", value: node.value } as HastText;
      if (node.type === "item") return node.value;
      return {
        type: "element",
        tagName: as,
        properties: { ...properties },
        children: toHast(node.children),
      } as HastElement;
    });

  const visit = (parent: HastNode): void => {
    const children = parent.children;
    if (!children) return;
    for (const child of children) {
      if (child.type === "element" && SKIP.has((child as HastElement).tagName)) continue;
      visit(child);
    }

    // Leave the children untouched unless there is something to change, so
    // whitespace and positions in text without brackets stay as they were.
    const texts = children.filter((child): child is HastText => child.type === "text");
    if (!texts.some((text) => text.value.includes("[") || text.value.includes("]"))) return;

    const parts = children.map((child) => (child.type === "text" ? (child as HastText).value : child));
    const nodes = parseParts<HastNode>(parts);
    const hasEscape = texts.some((text) => ESCAPED_BRACKET.test(text.value));
    if (!hasEscape && !nodes.some((node) => node.type === "group")) return;

    parent.children = toHast(nodes);
  };

  return (tree: HastNode): void => visit(tree);
}

export { rehypeWordhug };
