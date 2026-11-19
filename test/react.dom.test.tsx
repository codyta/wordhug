import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { WordHug } from "../src/react";

afterEach(cleanup);

describe("WordHug", () => {
  it("wraps groups in inline-block spans with spaces only between words", () => {
    const { container } = render(
      <p>
        <WordHug>{"Hello [big world] today"}</WordHug>
      </p>,
    );
    expect(container.innerHTML).toBe(
      '<p>Hello <span style="display: inline-block;">big world</span> today</p>',
    );
  });

  it("drops the default style when style is null", () => {
    const { container } = render(
      <WordHug className="nowrap" style={null}>
        {"[a]"}
      </WordHug>,
    );
    expect(container.innerHTML).toBe('<span class="nowrap">a</span>');
  });

  it("supports a custom element, className and nesting", () => {
    const { container } = render(
      <WordHug as="b" className="nowrap" style={{ whiteSpace: "nowrap" }}>
        {"[a [b]]"}
      </WordHug>,
    );
    expect(container.innerHTML).toBe(
      '<b class="nowrap" style="white-space: nowrap;">a <b class="nowrap" style="white-space: nowrap;">b</b></b>',
    );
  });

  it("renders nothing for null, undefined and empty input", () => {
    for (const value of [null, undefined, ""]) {
      const { container } = render(<WordHug>{value}</WordHug>);
      expect(container.innerHTML).toBe("");
      cleanup();
    }
  });

  it("updates when the text changes", () => {
    const { container, rerender } = render(<WordHug>{"[a b] c"}</WordHug>);
    rerender(<WordHug>{"d [e]"}</WordHug>);
    expect(container.innerHTML).toBe('d <span style="display: inline-block;">e</span>');
  });

  it("accepts a component as the wrapper", () => {
    const Mark = ({ children, className }: { children?: ReactNode; className?: string }) => (
      <mark className={className}>{children}</mark>
    );
    const { container } = render(
      <WordHug as={Mark} className="g">
        {"x [y]"}
      </WordHug>,
    );
    expect(container.innerHTML).toBe('x <mark class="g">y</mark>');
  });
});
