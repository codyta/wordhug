/**
 * The Solid component and function.
 *
 * @module wordhug/solid
 */
import { children, createComponent, type ResolvedElement } from "solid-js";
import { Dynamic, type JSX, type ValidComponent } from "@solidjs/web";
import { parseParts, type MixedNode } from "./parse";

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
  /**
   * Text to render. `[...]` groups are kept together on one line. Strings and
   * numbers are joined into one text, so `Hello [{name()}]` works. Elements
   * are kept as they are, each as one unit that a group can contain; brackets
   * inside an element are not read.
   */
  children?: JSX.Element;
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
  // Resolve once, so elements are created once and moved into place rather than rebuilt.
  const resolved = children(() => props.children);
  return (() =>
    render(props.text != null ? [props.text] : childrenParts(resolved.toArray()), {
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
export function wordhug(text: string | null | undefined, options?: WordHugOptions): JSX.Element {
  return text ? render([text], options) : null;
}

function render(
  parts: (string | ResolvedElement)[],
  { as = "span", class: className, style }: WordHugOptions = {},
): JSX.Element {
  const groupStyle = style === undefined ? DEFAULT_STYLE : (style ?? undefined);

  const renderNodes = (nodes: MixedNode<ResolvedElement>[]): JSX.Element[] =>
    nodes.map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "item") return node.value as JSX.Element;
      return createComponent(Dynamic as (props: Record<string, unknown>) => JSX.Element, {
        component: as,
        class: className,
        style: groupStyle,
        get children() {
          return renderNodes(node.children);
        },
      });
    });

  const nodes = parseParts(parts);
  return nodes.length > 0 ? (renderNodes(nodes) as unknown as JSX.Element) : null;
}

/**
 * Turn resolved children into strings and other nodes. Numbers become strings;
 * booleans, `null` and `undefined` are dropped; elements are kept as they are.
 */
function childrenParts(resolved: ResolvedElement[]): (string | ResolvedElement)[] {
  const out: (string | ResolvedElement)[] = [];
  for (const child of resolved) {
    if (child == null || typeof child === "boolean") continue;
    if (typeof child === "string") out.push(child);
    else if (typeof child === "number" || typeof child === "bigint") out.push(String(child));
    else out.push(child);
  }
  return out;
}
