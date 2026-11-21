/**
 * The core: the parser and the HTML string renderer. Imports no framework.
 *
 * @module wordhug
 */
export { parseBrackets } from "./parse";
export type { Node, TextNode, GroupNode } from "./parse";
export { wordhugHtml, renderToHtml } from "./html";
export { wordhugMarkup } from "./markup";
export type { WordhugHtmlOptions, RenderToHtmlOptions } from "./html";
