import { parseBrackets, type Node } from "./parse";

export interface WordhugHtmlOptions {
  /** Tag name used to wrap each group. Defaults to `"span"`. */
  as?: string;
  /** Class attribute for each group wrapper. */
  class?: string;
  /**
   * Style attribute for each group wrapper. Defaults to `"display: inline-block"`.
   * Pass `null` to leave styling entirely to `class`.
   */
  style?: string | null;
}

const TAG_NAME = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * Render text to an HTML string in which every `[bracketed phrase]` is wrapped
 * in an element (an inline-block span by default). Text and attribute values
 * are escaped, so the result is safe to insert as HTML.
 */
export function wordhugHtml(
  text: string | null | undefined,
  options: WordhugHtmlOptions = {},
): string {
  if (!text) return "";
  const { open, close } = groupTags(options);

  const render = (nodes: Node[]): string =>
    nodes
      .map((node) =>
        node.type === "text" ? escapeHtml(node.value) : open + render(node.children) + close,
      )
      .join("");

  return render(parseBrackets(text));
}

/** The opening and closing tags of a group wrapper. Internal, shared with `wordhugMarkup`. */
export function groupTags({
  as = "span",
  class: className,
  style = "display: inline-block",
}: WordhugHtmlOptions): { open: string; close: string } {
  if (!TAG_NAME.test(as)) throw new TypeError(`wordhug: invalid tag name ${JSON.stringify(as)}`);
  let attrs = "";
  if (className) attrs += ` class="${escapeHtml(className)}"`;
  if (style) attrs += ` style="${escapeHtml(style)}"`;
  return { open: `<${as}${attrs}>`, close: `</${as}>` };
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]!);
}

/** @deprecated Renamed to {@link wordhugHtml}. This alias will be removed in a future release. */
export const renderToHtml = wordhugHtml;

/** @deprecated Renamed to {@link WordhugHtmlOptions}. */
export type RenderToHtmlOptions = WordhugHtmlOptions;
