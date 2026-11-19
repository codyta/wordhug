import { describe, expect, it } from "vitest";
import { renderToHtml, wordhugHtml } from "../src";

describe("wordhugHtml", () => {
  it("wraps groups in inline-block spans", () => {
    expect(wordhugHtml("Hello [big world] today")).toBe(
      'Hello <span style="display: inline-block">big world</span> today',
    );
  });

  it("supports a custom tag, class, null style and nesting", () => {
    expect(wordhugHtml("[a [b]]", { as: "b", class: "nowrap", style: null })).toBe(
      '<b class="nowrap">a <b class="nowrap">b</b></b>',
    );
  });

  it("escapes text and attributes", () => {
    expect(wordhugHtml(`<i>&</i> [x"y]`, { class: `"><script>` })).toBe(
      '&lt;i&gt;&amp;&lt;/i&gt; <span class="&quot;&gt;&lt;script&gt;" style="display: inline-block">x&quot;y</span>',
    );
  });

  it("rejects tag names that are not plain element names", () => {
    expect(() => wordhugHtml("[a]", { as: "span onclick=x" })).toThrow(TypeError);
  });

  it("returns an empty string for empty input", () => {
    for (const value of [null, undefined, ""]) expect(wordhugHtml(value)).toBe("");
  });

  it("keeps renderToHtml as a deprecated alias", () => {
    expect(renderToHtml).toBe(wordhugHtml);
  });
});
