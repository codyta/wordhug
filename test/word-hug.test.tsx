// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WordHug } from "../src";

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
});
