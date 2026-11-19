import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { WordHug } from "../src/vue";

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
