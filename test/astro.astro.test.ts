import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import WordHug from "../src/astro/WordHug.astro";
import Children from "./fixtures/Children.astro";
import Default, { WordHug as Named, wordhug } from "../src/astro/index.js";

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

  it("splits formatting around a group in the children, and warns in development when it can't", async () => {
    expect(await render({}, { default: "<b>a [b</b> c]" })).toBe(
      '<b>a </b><span style="display: inline-block"><b>b</b> c</span>',
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await render({}, { default: '[a <a href="u">b] c</a>' })).toBe('[a <a href="u">b] c</a>');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("prefers text over children", async () => {
    expect(await render({ text: "[a]" }, { default: "[b]" })).toBe('<span style="display: inline-block">a</span>');
  });
});

describe("wordhug/astro entry", () => {
  it("exports the component as default and as WordHug", () => {
    expect(Default).toBe(WordHug);
    expect(Named).toBe(WordHug);
  });

  it("exports wordhug, which returns an escaped HTML string like the component", async () => {
    expect(wordhug("Fish & [chips <now>]")).toBe(await render({ text: "Fish & [chips <now>]" }));
    expect(wordhug(null)).toBe("");
  });
});
