import {
  defineComponent,
  Fragment,
  h,
  Comment,
  Text,
  type Component,
  type HTMLAttributes,
  type PropType,
  type StyleValue,
  type VNode,
  type VNodeChild,
} from "vue";
import { parseParts, type MixedNode } from "./parse";

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
 * Render the default slot so that every `[bracketed phrase]` is wrapped
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
      render(slotParts(slots.default?.()), {
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
  options?: WordHugOptions,
): VNode | null {
  return text ? render([text], options) : null;
}

function render(
  parts: (string | VNode)[],
  { as = "span", class: className, style = DEFAULT_STYLE }: WordHugOptions = {},
): VNode | null {
  const groupProps: Record<string, unknown> = {};
  if (className != null) groupProps.class = className;
  if (style != null) groupProps.style = style;

  const renderNodes = (nodes: MixedNode<VNode>[]): VNodeChild[] =>
    nodes.map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "item") return node.value;
      return h(as as string, groupProps, { default: () => renderNodes(node.children) });
    });

  const nodes = parseParts(parts);
  return nodes.length > 0 ? h(Fragment, renderNodes(nodes)) : null;
}

/**
 * Flatten slot vnodes into strings (from text vnodes) and other vnodes, looking
 * inside fragments such as `v-for` lists. Comments (from `v-if`) are dropped;
 * elements and components are kept as they are.
 */
function slotParts(vnodes: VNode[] | undefined, out: (string | VNode)[] = []): (string | VNode)[] {
  for (const vnode of vnodes ?? []) {
    if (vnode.type === Comment) continue;
    if (vnode.type === Text) out.push(String(vnode.children ?? ""));
    else if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      slotParts(vnode.children as VNode[], out);
    } else out.push(vnode);
  }
  return out;
}
