import { createComponent } from "solid-js";
import { Dynamic, type JSX, type ValidComponent } from "@solidjs/web";
import { parseBrackets, type Node } from "./parse";

export interface WordHugProps {
  /** Text to render. `[...]` groups are kept together on one line. */
  children: string | null | undefined;
  /** Element or component used to wrap each group. Defaults to `"span"`. */
  as?: ValidComponent;
  /** Class for each group wrapper. */
  class?: string;
  /**
   * Inline style for each group wrapper. Defaults to `{ display: "inline-block" }`.
   * Pass `null` to leave styling entirely to `class`.
   */
  style?: JSX.CSSProperties | string | null;
}

const DEFAULT_STYLE: JSX.CSSProperties = { display: "inline-block" };

/**
 * Render text so that every `[bracketed phrase]` is wrapped in an element
 * (an inline-block span by default) that moves to the next line as one unit.
 * Re-renders when `children` changes.
 */
export function WordHug(props: WordHugProps): JSX.Element {
  const render = (nodes: Node[]): JSX.Element[] =>
    nodes.map((node) =>
      node.type === "text"
        ? node.value
        : createComponent(Dynamic as (props: Record<string, unknown>) => JSX.Element, {
            get component() {
              return props.as ?? "span";
            },
            get class() {
              return props.class;
            },
            get style() {
              return props.style === undefined ? DEFAULT_STYLE : (props.style ?? undefined);
            },
            get children() {
              return render(node.children);
            },
          }),
    );

  return (() => (props.children ? render(parseBrackets(props.children)) : null)) as unknown as JSX.Element;
}
