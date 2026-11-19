import {
  defineComponent,
  h,
  Text,
  type Component,
  type PropType,
  type StyleValue,
  type VNode,
  type VNodeChild,
} from "vue";
import { parseBrackets, type Node } from "./parse";

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
    return () => {
      const text = slotText(slots.default?.());
      if (!text) return null;

      const style = "style" in attrs ? (attrs.style as StyleValue) : DEFAULT_STYLE;
      const groupProps: Record<string, unknown> = {};
      if (attrs.class != null) groupProps.class = attrs.class;
      if (style != null) groupProps.style = style;
      const render = (nodes: Node[]): VNodeChild[] =>
        nodes.map((node) =>
          node.type === "text"
            ? node.value
            : h(props.as as string, groupProps, { default: () => render(node.children) }),
        );

      return render(parseBrackets(text));
    };
  },
});

/** Concatenate the plain text in a slot. Elements and components are ignored. */
function slotText(vnodes: VNode[] | undefined): string {
  let text = "";
  for (const vnode of vnodes ?? []) {
    if (vnode.type === Text && typeof vnode.children === "string") text += vnode.children;
    else if (Array.isArray(vnode.children)) text += slotText(vnode.children as VNode[]);
  }
  return text;
}
