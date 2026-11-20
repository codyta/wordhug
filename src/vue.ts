import {
  defineComponent,
  Fragment,
  h,
  Text,
  type Component,
  type HTMLAttributes,
  type PropType,
  type StyleValue,
  type VNode,
  type VNodeChild,
} from "vue";
import { parseBrackets, type Node } from "./parse";

export interface WordHugOptions {
  /** Element or component used to wrap each group. Defaults to `"span"`. */
  as?: string | Component;
  /** Class for each group wrapper, in any form Vue accepts (string, array or object). */
  class?: HTMLAttributes["class"];
  /**
   * Inline style for each group wrapper. Defaults to `{ display: "inline-block" }`.
   * Pass `null` to leave styling entirely to `class`.
   */
  style?: StyleValue | null;
}

const DEFAULT_STYLE: StyleValue = { display: "inline-block" };

/**
 * Render the default slot's text so that every `[bracketed phrase]` is wrapped
 * in an element (an inline-block span by default) that moves to the next line
 * as one unit. `class` and `style` go on each group wrapper; `style` defaults
 * to `display: inline-block`, and `:style="null"` removes it.
 */
export const WordHug = defineComponent({
  name: "WordHug",
  inheritAttrs: false,
  props: {
    /** Element or component used to wrap each group. Defaults to `"span"`. */
    as: { type: [String, Object, Function] as PropType<string | Component>, default: "span" },
  },
  setup(props, { slots, attrs }) {
    return () =>
      wordhug(slotText(slots.default?.()), {
        as: props.as,
        class: attrs.class as WordHugOptions["class"],
        style: "style" in attrs ? (attrs.style as StyleValue | null) : undefined,
      });
  },
});

/**
 * Like `<WordHug>`, as a function: returns a VNode in which every
 * `[bracketed phrase]` is wrapped in an element that moves to the next line
 * as one unit. Use it in render functions, Vue JSX, or anywhere a VNode is
 * expected. Returns `null` for empty text.
 */
export function wordhug(
  text: string | null | undefined,
  { as = "span", class: className, style = DEFAULT_STYLE }: WordHugOptions = {},
): VNode | null {
  if (!text) return null;

  const groupProps: Record<string, unknown> = {};
  if (className != null) groupProps.class = className;
  if (style != null) groupProps.style = style;

  const render = (nodes: Node[]): VNodeChild[] =>
    nodes.map((node) =>
      node.type === "text"
        ? node.value
        : h(as as string, groupProps, { default: () => render(node.children) }),
    );

  return h(Fragment, render(parseBrackets(text)));
}

/** Concatenate the plain text in a slot. Elements and components are ignored. */
function slotText(vnodes: VNode[] | undefined): string {
  let text = "";
  for (const vnode of vnodes ?? []) {
    if (vnode.type === Text && typeof vnode.children === "string") text += vnode.children;
    else if (Array.isArray(vnode.children)) text += slotText(vnode.children as VNode[]);
  }
  return text;
}
