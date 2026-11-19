import { describe, expect, it } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { WordHug } from "../src/svelte/index.js";

const html = (el: HTMLElement) => el.innerHTML.replace(/<!--[^>]*-->/g, "");

describe("Svelte WordHug in the browser", () => {
  it("renders groups and updates when the props change", () => {
    const el = document.createElement("div");
    const props = $state({ text: "[a b] c" as string | null, class: "g" });
    const app = mount(WordHug, { target: el, props });
    expect(html(el)).toBe('<span class="g" style="display: inline-block;">a b</span> c');

    props.text = "d [e]";
    flushSync();
    expect(html(el)).toBe('d <span class="g" style="display: inline-block;">e</span>');

    props.text = null;
    flushSync();
    expect(html(el)).toBe("");
    unmount(app);
  });
});
