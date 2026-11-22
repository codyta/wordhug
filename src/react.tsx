/**
 * The React component and function.
 *
 * @module wordhug/react
 */
import {
  Fragment,
  isValidElement,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { parseParts, type MixedNode } from "./parse";

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
  /** Text to render, as an alternative to children. When given, children are ignored. */
  text?: string | null;
  /**
   * Text to render. `[...]` groups are kept together on one line. Strings and
   * numbers are joined into one text, including inside arrays and fragments, so
   * `Hello [{name}]` works. Elements are kept as they are, each as one unit that
   * a group can contain; brackets inside an element are not read.
   */
  children?: ReactNode;
}

const DEFAULT_STYLE: CSSProperties = { display: "inline-block" };

/**
 * Render text so that every `[bracketed phrase]` is wrapped in an element
 * (an inline-block span by default) that moves to the next line as one unit.
 * Has no hooks or client-only code, so it works in React Server Components.
 */
export function WordHug({ text, children, ...options }: WordHugProps): ReactNode {
  return wordhug(text ?? children, options);
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
  const parts = childrenParts(input);
  if (parts.length === 0) return null;

  const renderNodes = (nodes: MixedNode<ReactNode>[]): ReactNode[] =>
    nodes.map((node, i) => {
      if (node.type === "text") return node.value;
      if (node.type === "item") return <Fragment key={i}>{node.value}</Fragment>;
      return (
        <Tag key={i} className={className} style={style ?? undefined}>
          {renderNodes(node.children)}
        </Tag>
      );
    });

  const nodes = parseParts(parts);
  return nodes.length > 0 ? <>{renderNodes(nodes)}</> : null;
}

/**
 * Flatten React children into strings and other nodes, looking inside arrays and
 * fragments. Numbers become strings; booleans, `null` and `undefined` are dropped;
 * elements and anything else React can render are kept as they are.
 */
function childrenParts(node: ReactNode, out: (string | ReactNode)[] = []): (string | ReactNode)[] {
  if (node == null || typeof node === "boolean") return out;
  if (typeof node === "string") out.push(node);
  else if (typeof node === "number" || typeof node === "bigint") out.push(String(node));
  else if (Array.isArray(node)) for (const child of node) childrenParts(child, out);
  else if (isValidElement(node) && node.type === Fragment) {
    childrenParts((node as ReactElement<{ children?: ReactNode }>).props.children, out);
  } else out.push(node);
  return out;
}
