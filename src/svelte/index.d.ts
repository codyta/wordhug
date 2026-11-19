import type { Component } from "svelte";

export interface WordHugProps {
  /** Text to render. `[...]` groups are kept together on one line. */
  text: string | null | undefined;
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

export declare const WordHug: Component<WordHugProps>;
