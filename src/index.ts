/**
 * The core: the parser and the HTML string renderer. Imports no framework.
 *
 * @module wordhug
 */
export { parseBrackets } from "./parse";
export type { Node, TextNode, GroupNode } from "./parse";
export { wordhugHtml, renderToHtml } from "./html";
export type { WordhugHtmlOptions, RenderToHtmlOptions } from "./html";
export { wordhugRichText } from "./rich-text";
export type { WordhugRichTextGroup, WordhugRichTextGroupOption, WordhugRichTextOptions } from "./rich-text";
