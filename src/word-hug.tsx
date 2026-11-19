import type { CSSProperties, ElementType, ReactNode } from "react";
import { parseBrackets, type Node } from "./parse";

export interface WordHugProps {
  /** Text to render. `[...]` groups are kept together on one line. */
  children: string | null | undefined;
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

const DEFAULT_STYLE: CSSProperties = { display: "inline-block" };

/**
 * Render text so that every `[bracketed phrase]` is wrapped in an element
 * (an inline-block span by default) that moves to the next line as one unit.
 * Has no hooks or client-only code, so it works in React Server Components.
 */
export function WordHug({
  children,
  as: Tag = "span",
  className,
  style = DEFAULT_STYLE,
}: WordHugProps): ReactNode {
  if (!children) return null;

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

  return <>{renderNodes(parseBrackets(children))}</>;
}
