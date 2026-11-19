import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { wordhugHtml, type WordhugHtmlOptions } from "../src";
import { WordHug } from "../src/react";

// A monospace font makes widths predictable: every character is 1ch wide.
const FONT = "font: 20px/1.5 monospace; margin: 0;";

let container: HTMLElement | undefined;
afterEach(() => container?.remove());

function mount(widthCh: number): HTMLElement {
  container = document.createElement("p");
  container.style.cssText = `${FONT} width: ${widthCh}ch;`;
  document.body.append(container);
  return container;
}

function render(text: string, widthCh: number, options?: WordhugHtmlOptions): HTMLElement {
  const el = mount(widthCh);
  el.innerHTML = wordhugHtml(text, options);
  return el;
}

// Line height is 30px; boxes on the same line can sit a few pixels apart
// (a nested inline-block aligns to its baseline), so anything closer than
// half a line counts as the same line.
const SAME_LINE = 15;

/** The distinct lines the text inside `node` is laid out on, by top position. */
function lineTops(node: Node): number[] {
  const range = document.createRange();
  range.selectNodeContents(node);
  const tops = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.top);
  const lines: number[] = [];
  for (const top of tops.sort((a, b) => a - b)) {
    if (lines.length === 0 || top - lines[lines.length - 1]! >= SAME_LINE) lines.push(top);
  }
  return lines;
}

/** The line position of the first occurrence of `word` in `root`. */
function topOf(root: HTMLElement, word: string): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent!.indexOf(word);
    if (index === -1) continue;
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + word.length);
    return Math.round(range.getClientRects()[0]!.top);
  }
  throw new Error(`"${word}" not found`);
}

describe("layout in a real browser", () => {
  // At 12ch, "Hello big world today" breaks between "big" and "world".
  it("breaks a phrase without brackets (control)", () => {
    const el = render("Hello big world today", 12);
    expect(topOf(el, "big")).not.toBe(topOf(el, "world"));
  });

  it("keeps a bracketed phrase on one line, moving it down as a whole", () => {
    const el = render("Hello [big world] today", 12);
    const group = el.querySelector("span")!;
    expect(lineTops(group)).toHaveLength(1);
    expect(topOf(el, "big")).toBe(topOf(el, "world"));
    expect(topOf(el, "big")).toBeGreaterThan(topOf(el, "Hello"));
  });

  it("keeps nested groups together", () => {
    // The outer group is 20ch: at 22ch it fits on a line, but not after "Pay ".
    const el = render("Pay [only [$9.99] per month] today", 22);
    const outer = el.querySelector("span")!;
    expect(lineTops(outer)).toHaveLength(1);
    expect(topOf(el, "only")).toBeGreaterThan(topOf(el, "Pay"));
  });

  it("does nothing without the inline-block style", () => {
    const el = render("Hello [big world] today", 12, { style: null });
    expect(topOf(el, "big")).not.toBe(topOf(el, "world"));
  });

  it("wraps a group wider than its container inside its own box", () => {
    const el = render("[aaaa bbbb cccc]", 6);
    const group = el.querySelector("span")!;
    expect(lineTops(group).length).toBeGreaterThan(1);
    expect(group.getBoundingClientRect().width).toBeLessThanOrEqual(el.getBoundingClientRect().width);
  });

  it("never breaks a nowrap group, overflowing instead", () => {
    const el = render("[aaaa bbbb cccc]", 6, { style: "display: inline-block; white-space: nowrap" });
    const group = el.querySelector("span")!;
    expect(lineTops(group)).toHaveLength(1);
    expect(group.getBoundingClientRect().width).toBeGreaterThan(el.getBoundingClientRect().width);
  });

  it("keeps a phrase together through the React component", async () => {
    const el = mount(12);
    const root = createRoot(el);
    await act(async () => root.render(<WordHug>{"Hello [big world] today"}</WordHug>));
    expect(topOf(el, "big")).toBe(topOf(el, "world"));
    expect(topOf(el, "big")).toBeGreaterThan(topOf(el, "Hello"));
    await act(async () => root.unmount());
  });
});
