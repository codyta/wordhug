/**
 * The Solid component and function.
 *
 * @module wordhug/solid
 */
import { createComponent } from "solid-js";
import { Dynamic, type JSX, type ValidComponent } from "@solidjs/web";
import { parseBrackets, type Node } from "./parse";

export interface WordHugOptions {
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

export interface WordHugProps extends WordHugOptions {
  /** Text to render. `[...]` groups are kept together on one line. */
  children?: string | null | undefined;
  /** Text to render, as an alternative to children. When given, children are ignored. */
  text?: string | null | undefined;
}

const DEFAULT_STYLE: JSX.CSSProperties = { display: "inline-block" };

/**
 * Render text so that every `[bracketed phrase]` is wrapped in an element
 * (an inline-block span by default) that moves to the next line as one unit.
 * Re-renders when any prop changes.
 */
export function WordHug(props: WordHugProps): JSX.Element {
  return (() =>
    wordhug(props.text ?? props.children, {
      as: props.as,
      class: props.class,
      style: props.style,
    })) as unknown as JSX.Element;
}

/**
 * Like `<WordHug>`, as a function: returns a `JSX.Element` in which every
 * `[bracketed phrase]` is wrapped in an element that moves to the next line
 * as one unit. It reads its arguments once; call it inside JSX
 * (`{wordhug(title())}`) or a memo to re-render when they change.
 * Returns `null` for empty text.
 */
export function wordhug(
  text: string | null | undefined,
  { as = "span", class: className, style }: WordHugOptions = {},
): JSX.Element {
  if (!text) return null;
  const groupStyle = style === undefined ? DEFAULT_STYLE : (style ?? undefined);

  const render = (nodes: Node[]): JSX.Element[] =>
    nodes.map((node) =>
      node.type === "text"
        ? node.value
        : createComponent(Dynamic as (props: Record<string, unknown>) => JSX.Element, {
            component: as,
            class: className,
            style: groupStyle,
            get children() {
              return render(node.children);
            },
          }),
    );

  return render(parseBrackets(text)) as unknown as JSX.Element;
}
