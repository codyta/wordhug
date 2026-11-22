import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import { WordHug, wordhug } from "../src/svelte/index.js";

const html = (props: Parameters<typeof render<typeof WordHug>>[1]["props"]) =>
  render(WordHug, { props }).body.replace(/<!--[^>]*-->/g, "");

describe("Svelte WordHug", () => {
  it("wraps groups in inline-block spans", () => {
    expect(html({ text: "Hello [big world] today" })).toBe(
      'Hello <span style="display: inline-block">big world</span> today',
    );
  });

  it("supports a custom tag, class, null style and nesting", () => {
    expect(html({ text: "[a [b]]", as: "b", class: "nowrap", style: null })).toBe(
      '<b class="nowrap">a <b class="nowrap">b</b></b>',
    );
  });

  it("renders nothing for empty input", () => {
    for (const text of [null, undefined, ""]) expect(html({ text })).toBe("");
  });
});

describe("Svelte wordhug", () => {
  it("returns an escaped HTML string that renders like the component", () => {
    expect(wordhug("Fish & [chips]", { class: "nowrap" })).toBe(
      'Fish &amp; <span class="nowrap" style="display: inline-block">chips</span>',
    );
    expect(wordhug("Hello [big world] today")).toBe(html({ text: "Hello [big world] today" }));
  });

  it("returns an empty string for empty text", () => {
    for (const text of [null, undefined, ""]) expect(wordhug(text)).toBe("");
  });
});
