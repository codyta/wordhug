import { describe, expect, it } from "vitest";
import { renderToHtml } from "../src";

describe("renderToHtml", () => {
  it("wraps groups in inline-block spans", () => {
    expect(renderToHtml("Hello [big world] today")).toBe(
      'Hello <span style="display: inline-block">big world</span> today',
    );
  });

  it("supports a custom tag, class, null style and nesting", () => {
    expect(renderToHtml("[a [b]]", { as: "b", class: "nowrap", style: null })).toBe(
      '<b class="nowrap">a <b class="nowrap">b</b></b>',
    );
  });

  it("escapes text and attributes", () => {
    expect(renderToHtml(`<i>&</i> [x"y]`, { class: `"><script>` })).toBe(
      '&lt;i&gt;&amp;&lt;/i&gt; <span class="&quot;&gt;&lt;script&gt;" style="display: inline-block">x&quot;y</span>',
    );
  });

  it("rejects tag names that are not plain element names", () => {
    expect(() => renderToHtml("[a]", { as: "span onclick=x" })).toThrow(TypeError);
  });

  it("returns an empty string for empty input", () => {
    for (const value of [null, undefined, ""]) expect(renderToHtml(value)).toBe("");
  });
});
