import { describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { WordHug, wordhug } from "../src/vue";

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

  it("accepts a component as the wrapper and passes it class and style", () => {
    const Mark = defineComponent({
      setup: (_, { slots }) => () => h("mark", slots.default?.()),
    });
    const el = document.createElement("div");
    createApp({ render: () => h(WordHug, { as: Mark, class: "g", style: null }, () => "x [y]") }).mount(el);
    expect(el.innerHTML).toBe('x <mark class="g">y</mark>');
  });

  it("wordhug re-renders from a render function", async () => {
    const text = ref("[a b] c");
    const el = document.createElement("div");
    createApp({ render: () => h("p", [wordhug(text.value, { class: "g" })]) }).mount(el);
    expect(el.innerHTML).toBe('<p><span class="g" style="display: inline-block;">a b</span> c</p>');
    text.value = "d [e]";
    await nextTick();
    expect(el.innerHTML).toBe('<p>d <span class="g" style="display: inline-block;">e</span></p>');
  });
});
