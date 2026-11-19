import {
  Fragment,
  isValidElement,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { parseBrackets, type Node } from "./parse";

export interface WordHugOptions {
  /** Element used to wrap each group. Defaults to `"span"`. */
  as?: ElementType;
  /** Class name for each group wrapper. */
  className?: string;
  /**
   * Inline style for each group wrapper. Defaults to `{ display: "inline-block" }`,
   * so groups stay together without any stylesheet. Pass `null` to leave styling
   * entirely to `className`.
   */
  style?: CSSProperties | null;
}

export interface WordHugProps extends WordHugOptions {
  /**
   * Text to render. `[...]` groups are kept together on one line. Strings and
   * numbers are joined into one text, including inside arrays and fragments, so
   * `Hello [{name}]` works. Other elements are ignored.
   */
  children?: ReactNode;
}

const DEFAULT_STYLE: CSSProperties = { display: "inline-block" };

/**
 * Render text so that every `[bracketed phrase]` is wrapped in an element
 * (an inline-block span by default) that moves to the next line as one unit.
 * Has no hooks or client-only code, so it works in React Server Components.
 */
export function WordHug({ children, ...options }: WordHugProps): ReactNode {
  return wordhug(children, options);
}

/**
 * Like `<WordHug>`, as a function: returns a React node in which every
 * `[bracketed phrase]` is wrapped in an element that moves to the next line
 * as one unit. Accepts the same input as `WordHug`'s children.
 */
export function wordhug(
  input: ReactNode,
  { as: Tag = "span", className, style = DEFAULT_STYLE }: WordHugOptions = {},
): ReactNode {
  const text = childrenText(input);
  if (!text) return null;

  const renderNodes = (nodes: Node[]): ReactNode[] =>
    nodes.map((node, i) =>
      node.type === "text" ? (
        node.value
      ) : (
        <Tag key={i} className={className} style={style ?? undefined}>
          {renderNodes(node.children)}
        </Tag>
      ),
    );

  return <>{renderNodes(parseBrackets(text))}</>;
}

/**
 * Join the strings and numbers in React children into one text, looking inside
 * arrays and fragments. Other elements, booleans, `null` and `undefined` add nothing.
 */
function childrenText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(childrenText).join("");
  if (isValidElement(node) && node.type === Fragment) {
    return childrenText((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
}
