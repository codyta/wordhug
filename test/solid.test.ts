import { describe, expect, it } from "vitest";
import { createComponent } from "solid-js";
import { renderToString } from "@solidjs/web";
import { WordHug, wordhug, type WordHugProps } from "../src/solid";

const ssr = (props: WordHugProps) => renderToString(() => createComponent(WordHug, props));

describe("Solid WordHug", () => {
  it("wraps groups in inline-block spans", () => {
    expect(ssr({ children: "Hello [big world] today" })).toMatch(
      /^Hello <span _hk=\S+ style="display:inline-block">big world<\/span> today$/,
    );
  });

  it("renders the text prop, which wins over children", () => {
    const strip = (html: string) => html.replace(/ _hk=\S+/g, "");
    expect(strip(ssr({ text: "Hello [big world]" }))).toBe('Hello <span style="display:inline-block">big world</span>');
    expect(strip(ssr({ text: "[a]", children: "[b]" }))).toBe('<span style="display:inline-block">a</span>');
    expect(ssr({ text: "", children: "[b]" })).toBe("");
    expect(strip(ssr({ text: null, children: "[b]" }))).toBe('<span style="display:inline-block">b</span>');
  });

  it("supports a custom element, class, null style and nesting", () => {
    const html = ssr({ children: "[a [b]]", as: "b", class: "nowrap", style: null });
    expect(html.replace(/ _hk=\S+/g, "")).toBe('<b class="nowrap">a <b class="nowrap">b</b></b>');
  });

  it("renders nothing for empty input", () => {
    for (const children of [null, undefined, ""]) expect(ssr({ children })).toBe("");
  });
});

describe("Solid wordhug", () => {
  it("returns an element that renders like the component", () => {
    expect(renderToString(() => wordhug("Hello [big world] today"))).toMatch(
      /^Hello <span _hk=\S+ style="display:inline-block">big world<\/span> today$/,
    );
  });

  it("takes as, class and style options", () => {
    const html = renderToString(() => wordhug("[a [b]]", { as: "b", class: "nowrap", style: null }));
    expect(html.replace(/ _hk=\S+/g, "")).toBe('<b class="nowrap">a <b class="nowrap">b</b></b>');
  });

  it("returns null for empty text", () => {
    for (const value of [null, undefined, ""]) expect(wordhug(value)).toBeNull();
  });
});
