import { describe, expect, it } from "vitest";
import { createComponent, createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";
import { WordHug, wordhug } from "../src/solid";

describe("Solid WordHug in the browser", () => {
  it("renders groups and updates when the props change", () => {
    const [text, setText] = createSignal<string | null>("[a b] c");
    const [style, setStyle] = createSignal<string | null | undefined>(undefined);
    const el = document.createElement("div");
    const dispose = render(
      () =>
        createComponent(WordHug, {
          get children() {
            return text();
          },
          get style() {
            return style();
          },
          class: "g",
        }),
      el,
    );
    expect(el.innerHTML).toBe('<span class="g" style="display: inline-block;">a b</span> c');

    setText("d [e [f]]");
    flush();
    expect(el.innerHTML).toBe(
      'd <span class="g" style="display: inline-block;">e <span class="g" style="display: inline-block;">f</span></span>',
    );

    setStyle(null);
    flush();
    expect(el.innerHTML).toBe('d <span class="g">e <span class="g">f</span></span>');

    setText(null);
    flush();
    expect(el.innerHTML).toBe("");
    dispose();
  });

  it("wordhug re-renders when called inside a reactive expression", () => {
    const [text, setText] = createSignal("[a b] c");
    const el = document.createElement("div");
    // Equivalent of `{wordhug(text(), ...)}` in JSX: the compiler wraps the expression in a function.
    const dispose = render(() => (() => wordhug(text(), { class: "g" })) as unknown as Element, el);
    expect(el.innerHTML).toBe('<span class="g" style="display: inline-block;">a b</span> c');
    setText("d [e]");
    flush();
    expect(el.innerHTML).toBe('d <span class="g" style="display: inline-block;">e</span>');
    dispose();
  });
});
