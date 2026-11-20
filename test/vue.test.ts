import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { WordHug, wordhug } from "../src/vue";

const ssr = (props: Record<string, unknown>, text: string) =>
  renderToString(createSSRApp({ render: () => h(WordHug, props, () => text) }));

describe("Vue WordHug", () => {
  it("wraps groups in inline-block spans", async () => {
    expect(await ssr({}, "Hello [big world] today")).toBe(
      '<!--[-->Hello <span style="display:inline-block;">big world</span> today<!--]-->',
    );
  });

  it("puts class and style on each group, and drops the default style for null", async () => {
    expect(await ssr({ as: "b", class: "nowrap", style: null }, "[a [b]]")).toBe(
      '<!--[--><b class="nowrap">a <b class="nowrap">b</b></b><!--]-->',
    );
  });

  it("renders nothing for an empty slot", async () => {
    expect(await ssr({}, "")).toBe("<!---->");
  });

});

describe("Vue wordhug", () => {
  const ssrNode = (render: () => ReturnType<typeof h> | null) =>
    renderToString(createSSRApp({ render }));

  it("returns a VNode that renders like the component", async () => {
    expect(await ssrNode(() => h("p", [wordhug("Hello [big world] today")]))).toBe(
      '<p><!--[-->Hello <span style="display:inline-block;">big world</span> today<!--]--></p>',
    );
  });

  it("takes as, class and style options", async () => {
    const node = wordhug("[a [b]]", { as: "b", class: ["x", { y: true }], style: null });
    expect(await ssrNode(() => h("p", [node]))).toBe(
      '<p><!--[--><b class="x y">a <b class="x y">b</b></b><!--]--></p>',
    );
  });

  it("returns null for empty text", () => {
    for (const value of [null, undefined, ""]) expect(wordhug(value)).toBeNull();
  });
});
