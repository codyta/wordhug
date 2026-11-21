import { describe, expect, it } from "vitest";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypeWordhug, { type RehypeWordhugOptions } from "../src/rehype";

const md = (markdown: string, options?: RehypeWordhugOptions) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeWordhug, options)
      .use(rehypeStringify)
      .processSync(markdown),
  );

const SPAN = '<span style="display: inline-block">';

describe("rehypeWordhug", () => {
  it("wraps bracketed phrases in inline-block spans", () => {
    expect(md("Fresh bread [delivered daily] to [your door]")).toBe(
      `<p>Fresh bread ${SPAN}delivered daily</span> to ${SPAN}your door</span></p>`,
    );
  });

  it("works in headings, list items and nested groups", () => {
    expect(md("# Mẹo chọn đồ giúp bạn [ăn mặc] đẹp\n\n- [a [b c]]")).toBe(
      `<h1>Mẹo chọn đồ giúp bạn ${SPAN}ăn mặc</span> đẹp</h1>\n<ul>\n<li>${SPAN}a ${SPAN}b c</span></span></li>\n</ul>`,
    );
  });

  it("leaves markdown links, references, footnotes and task lists alone", () => {
    const out = md(
      "[a link](https://example.com) and [ref] and [b]\n\n[ref]: https://example.org\n\n- [x] done\n\nNote[^1]\n\n[^1]: Hi",
    );
    expect(out).toContain('<a href="https://example.com">a link</a> and <a href="https://example.org">ref</a> and ');
    expect(out).toContain(`${SPAN}b</span>`);
    expect(out).toContain('<input type="checkbox" checked disabled> done');
    expect(out).toContain('<sup><a href="#user-content-fn-1"');
    expect(out.match(/<span/g)).toHaveLength(1);
  });

  it("lets a group contain inline formatting", () => {
    expect(md("Buy [only **$9** today], or [*soon*]")).toBe(
      `<p>Buy ${SPAN}only <strong>$9</strong> today</span>, or ${SPAN}<em>soon</em></span></p>`,
    );
  });

  it("reads brackets inside inline elements", () => {
    expect(md("*[a b] c*")).toBe(`<p><em>${SPAN}a b</span> c</em></p>`);
  });

  it("does not touch code", () => {
    expect(md("`[a]` and\n\n```\n[b]\n```")).toBe(
      "<p><code>[a]</code> and</p>\n<pre><code>[b]\n</code></pre>",
    );
  });

  it("leaves text without groups exactly as it was", () => {
    expect(md("a ] b [ c\nd  e")).toBe("<p>a ] b [ c\nd  e</p>");
  });

  it("turns a double backslash before a bracket into a literal bracket", () => {
    // Markdown turns `\\` into `\`, leaving `\[` for wordhug.
    expect(md("Quote \\\\[sic\\\\] [here]")).toBe(`<p>Quote [sic] ${SPAN}here</span></p>`);
  });

  it("takes as, class and style options", () => {
    expect(md("x [y]", { as: "b", class: "nowrap tight", style: null })).toBe(
      '<p>x <b class="nowrap tight">y</b></p>',
    );
  });

  it("rejects tag names that are not plain element names", () => {
    expect(() => rehypeWordhug({ as: "span onclick" })).toThrow(TypeError);
  });
});
