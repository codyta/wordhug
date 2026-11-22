// `.astro` files are typed by Astro's own client types (`astro/client`), which Astro projects include.
export { default, default as WordHug } from "./WordHug.astro";

export interface WordHugOptions {
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
 * Like `<WordHug>`, as a function: returns an HTML string in which every
 * `[bracketed phrase]` is wrapped in an element that moves to the next line
 * as one unit. Text is escaped, so `<p set:html={wordhug(text)} />` is safe.
 * Returns `""` for empty text.
 */
export declare function wordhug(text: string | null | undefined, options?: WordHugOptions): string;
