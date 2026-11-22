import { groupTags, type WordhugHtmlOptions } from "./html";
import { parseParts, type MixedNode } from "./parse";

/** Markup that is copied as it is: a tag, a comment, or a whole element whose content isn't read. */
interface Raw {
  raw: string;
}

/** An element whose content is read for brackets. `close` is empty if the markup never closes it. */
interface Element {
  open: string;
  children: Piece[];
  close: string;
}

type Item = Raw | Element;
type Piece = string | Item;

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Elements whose content is code, not text at all, or rendered by something
 * else (an Astro island hydrates its own HTML), copied exactly as they are.
 */
const SKIP = new Set([
  "code", "pre", "kbd", "samp", "script", "style", "textarea", "title", "svg", "math", "template", "astro-island",
]);

/** Elements whose content is raw text that can contain `<`, so it ends only at its closing tag. */
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);

const TAG_START = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/y;
const ESCAPED_BRACKET = /\\[[\]]/;

/**
 * Like {@link wordhugHtml}, for text that is already HTML, such as rendered
 * children or HTML from a CMS. Brackets are read in the text only: tags,
 * attributes, comments, entities (so `&#91;` is a literal bracket) and the
 * content of `<code>`, `<pre>`, `<script>`, `<style>` and similar elements are
 * kept exactly as they are. The input is not escaped, so it must be trusted.
 *
 * Brackets are read within the text of one element: a group can contain inline
 * elements such as `<strong>`, but can't start in one element and end in
 * another. Text in an element without groups is left exactly as it was.
 */
export function wordhugMarkup(html: string | null | undefined, options: WordhugHtmlOptions = {}): string {
  if (!html) return "";
  const { open, close } = groupTags(options);

  const renderItem = (item: Item): string =>
    "raw" in item ? item.raw : item.open + renderPieces(item.children) + item.close;

  const renderNodes = (nodes: MixedNode<Item>[]): string =>
    nodes
      .map((node) => {
        if (node.type === "text") return node.value;
        if (node.type === "item") return renderItem(node.value);
        return open + renderNodes(node.children) + close;
      })
      .join("");

  const renderPieces = (pieces: Piece[]): string => {
    const unchanged = () => pieces.map((piece) => (typeof piece === "string" ? piece : renderItem(piece))).join("");
    const texts = pieces.filter((piece): piece is string => typeof piece === "string");
    if (!texts.some((text) => text.includes("[") || text.includes("]"))) return unchanged();

    // Whitespace is kept as written: this may be the inside of an inline element,
    // whose edge spaces separate it from the words around it.
    const nodes = parseParts<Item>(pieces, { keepWhitespace: true });
    const hasEscape = texts.some((text) => ESCAPED_BRACKET.test(text));
    if (!hasEscape && !nodes.some((node) => node.type === "group")) return unchanged();
    return renderNodes(nodes);
  };

  return renderPieces(parseMarkup(html));
}

/** Split HTML into text and items, nesting elements whose content is read. */
function parseMarkup(html: string): Piece[] {
  const lower = html.toLowerCase();
  const root: Element = { open: "", children: [], close: "" };
  const stack: { name: string; element: Element }[] = [{ name: "", element: root }];

  const add = (piece: Piece): void => {
    const children = stack[stack.length - 1]!.element.children;
    const last = children.length - 1;
    if (typeof piece === "string" && typeof children[last] === "string") children[last] += piece;
    else children.push(piece);
  };

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      add(html.slice(i));
      break;
    }
    const tag = readTag(html, lt);
    if (!tag) {
      // A `<` that doesn't start a tag, such as `a < b`, is text.
      add(html.slice(i, lt + 1));
      i = lt + 1;
      continue;
    }
    if (lt > i) add(html.slice(i, lt));
    i = tag.end;
    const source = html.slice(lt, tag.end);

    if (tag.kind === "other") {
      add({ raw: source });
    } else if (tag.kind === "close") {
      let at = stack.length - 1;
      while (at > 0 && stack[at]!.name !== tag.name) at--;
      if (at === 0) add({ raw: source });
      else {
        // Elements opened inside this one and never closed end here, as in HTML.
        stack[at]!.element.close = source;
        stack.length = at;
      }
    } else if (VOID.has(tag.name) || tag.selfClosing) {
      add({ raw: source });
    } else if (SKIP.has(tag.name)) {
      i = skipElement(html, lower, tag.end, tag.name);
      add({ raw: html.slice(lt, i) });
    } else {
      const element: Element = { open: source, children: [], close: "" };
      add(element);
      stack.push({ name: tag.name, element });
    }
  }
  return root.children;
}

interface Tag {
  kind: "open" | "close" | "other";
  name: string;
  selfClosing: boolean;
  /** Index just after the tag. */
  end: number;
}

/** Read the tag, comment or declaration starting at `lt`, or `null` if the `<` is text. */
function readTag(html: string, lt: number): Tag | null {
  if (html.startsWith("<!--", lt)) {
    const end = html.indexOf("-->", lt + 4);
    return { kind: "other", name: "", selfClosing: false, end: end === -1 ? html.length : end + 3 };
  }
  if (html[lt + 1] === "!" || html[lt + 1] === "?") {
    const end = html.indexOf(">", lt);
    return { kind: "other", name: "", selfClosing: false, end: end === -1 ? html.length : end + 1 };
  }

  TAG_START.lastIndex = lt;
  const match = TAG_START.exec(html);
  if (!match) return null;

  // Find the `>` that ends the tag, skipping any inside quoted attribute values.
  let quote = "";
  for (let i = TAG_START.lastIndex; i < html.length; i++) {
    const ch = html[i]!;
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return {
        kind: match[1] ? "close" : "open",
        name: match[2]!.toLowerCase(),
        selfClosing: html[i - 1] === "/",
        end: i + 1,
      };
    }
  }
  return null;
}

/** Index just after the closing tag of the `name` element whose content starts at `from`. */
function skipElement(html: string, lower: string, from: number, name: string): number {
  if (RAW_TEXT.has(name)) {
    const close = lower.indexOf(`</${name}`, from);
    if (close === -1) return html.length;
    return readTag(html, close)?.end ?? html.length;
  }

  let depth = 1;
  for (let lt = html.indexOf("<", from); lt !== -1; lt = html.indexOf("<", lt + 1)) {
    const tag = readTag(html, lt);
    if (!tag) continue;
    if (tag.name === name && tag.kind === "open" && !tag.selfClosing) depth++;
    if (tag.name === name && tag.kind === "close" && --depth === 0) return tag.end;
    lt = tag.end - 1;
  }
  return html.length;
}
