// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createApp, h, nextTick, ref } from "vue";
import { WordHug } from "../src/vue";

describe("Vue WordHug in the browser", () => {
  it("updates when the slot text changes", async () => {
    const text = ref("[a b] c");
    const el = document.createElement("div");
    createApp({ render: () => h(WordHug, null, () => text.value) }).mount(el);
    expect(el.innerHTML).toBe('<span style="display: inline-block;">a b</span> c');
    text.value = "d [e]";
    await nextTick();
    expect(el.innerHTML).toBe('d <span style="display: inline-block;">e</span>');
  });
});
