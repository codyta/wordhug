import { describe, expect, it } from "vitest";
import { createComponent } from "solid-js";
import { renderToString } from "@solidjs/web";
import { WordHug, type WordHugProps } from "../src/solid";

const ssr = (props: WordHugProps) => renderToString(() => createComponent(WordHug, props));

describe("Solid WordHug", () => {
  it("wraps groups in inline-block spans", () => {
    expect(ssr({ children: "Hello [big world] today" })).toMatch(
      /^Hello <span _hk=\S+ style="display:inline-block">big world<\/span> today$/,
    );
  });

  it("supports a custom element, class, null style and nesting", () => {
    const html = ssr({ children: "[a [b]]", as: "b", class: "nowrap", style: null });
    expect(html.replace(/ _hk=\S+/g, "")).toBe('<b class="nowrap">a <b class="nowrap">b</b></b>');
  });

  it("renders nothing for empty input", () => {
    for (const children of [null, undefined, ""]) expect(ssr({ children })).toBe("");
  });
});
