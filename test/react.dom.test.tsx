import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { WordHug, wordhug } from "../src/react";

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

  it("joins strings and numbers from JSX expressions into one text", () => {
    const name = "big world";
    const count = 3;
    const { container } = render(
      <WordHug>
        Hello [{name}] and [{count} more]
      </WordHug>,
    );
    expect(container.innerHTML).toBe(
      'Hello <span style="display: inline-block;">big world</span> and <span style="display: inline-block;">3 more</span>',
    );
  });

  it("reads text inside arrays and fragments", () => {
    const { container } = render(
      <WordHug>
        {["a [b", " c]"]}
        <>
          {" d "}
          {"[e]"}
        </>
      </WordHug>,
    );
    expect(container.innerHTML).toBe(
      'a <span style="display: inline-block;">b c</span> d <span style="display: inline-block;">e</span>',
    );
  });

  it("ignores elements, booleans and null in children", () => {
    const { container } = render(
      <WordHug>
        Buy <b>[now]</b>
        {false}
        {null} [today]
      </WordHug>,
    );
    expect(container.innerHTML).toBe('Buy <span style="display: inline-block;">today</span>');
  });

  it("renders nothing when the children hold no text", () => {
    const { container } = render(
      <WordHug>
        <b>only an element</b>
      </WordHug>,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("wordhug", () => {
  it("returns a React node that renders like the component", () => {
    const { container } = render(<p>{wordhug("Hello [big world] today")}</p>);
    expect(container.innerHTML).toBe(
      '<p>Hello <span style="display: inline-block;">big world</span> today</p>',
    );
  });

  it("takes the same options as the component", () => {
    const { container } = render(
      <p>{wordhug("[a [b]]", { as: "b", className: "nowrap", style: null })}</p>,
    );
    expect(container.innerHTML).toBe('<p><b class="nowrap">a <b class="nowrap">b</b></b></p>');
  });

  it("accepts React children as input", () => {
    const n = 2;
    const { container } = render(<p>{wordhug(<>x [{n} y]</>)}</p>);
    expect(container.innerHTML).toBe('<p>x <span style="display: inline-block;">2 y</span></p>');
  });

  it("returns null for empty input", () => {
    for (const value of [null, undefined, "", false, <b key="b">x</b>]) expect(wordhug(value)).toBeNull();
  });
});
