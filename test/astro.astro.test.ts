import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import WordHug from "../src/astro/WordHug.astro";

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(WordHug, { props });

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
});
