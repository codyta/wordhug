import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import WordHug from "../src/astro/WordHug.astro";
import Children from "./fixtures/Children.astro";

const render = async (props: Record<string, unknown>, slots?: Record<string, string>) =>
  (await AstroContainer.create()).renderToString(WordHug, { props, slots });

describe("Astro WordHug", () => {
  it("wraps groups in inline-block spans and escapes text", async () => {
    expect(await render({ text: "Fish & [chips <now>]" })).toBe(
      'Fish &amp; <span style="display: inline-block">chips &lt;now&gt;</span>',
    );
  });

  it("supports a custom tag, class, null style and nesting", async () => {
    expect(await render({ text: "[a [b]]", as: "b", class: "nowrap", style: null })).toBe(
      '<b class="nowrap">a <b class="nowrap">b</b></b>',
    );
  });

  it("renders nothing for empty input", async () => {
    for (const text of [null, undefined, ""]) expect(await render({ text })).toBe("");
  });

  it("reads the children when there is no text", async () => {
    expect(await render({ class: "nowrap" }, { default: "Fish &amp; [chips]" })).toBe(
      'Fish &amp; <span class="nowrap" style="display: inline-block">chips</span>',
    );
  });

  it("keeps elements and expressions in the children", async () => {
    const html = await (await AstroContainer.create()).renderToString(Children);
    expect(html).toBe(
      'Buy <span class="nowrap" style="display: inline-block">only <strong>$9 &amp; up</strong> today</span>, see <code>[code]</code>',
    );
  });

  it("prefers text over children", async () => {
    expect(await render({ text: "[a]" }, { default: "[b]" })).toBe('<span style="display: inline-block">a</span>');
  });
});
