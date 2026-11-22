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

  describe("groups across formatting", () => {
    it("splits bold and italic at the brackets so the group fits", () => {
      expect(md("**a [b** c]")).toBe(`<p><strong>a </strong>${SPAN}<strong>b</strong> c</span></p>`);
      expect(md("[a **b] c**")).toBe(`<p>${SPAN}a <strong>b</strong></span><strong> c</strong></p>`);
    });

    it("handles overlapping bold and italic", () => {
      expect(md("**Overlapping *[text** style]*")).toBe(
        `<p><em><em>Overlapping </em>${SPAN}<em><em>text</em></em> style</span></em></p>`,
      );
    });

    it("keeps brackets as text and adds a warning to the file when a link is in the way", () => {
      const tree = {
        type: "root",
        children: [
          { type: "text", value: "[a " },
          {
            type: "element",
            tagName: "a",
            properties: { href: "u" },
            children: [{ type: "text", value: "b] c" }],
          },
        ],
      };
      const messages: string[] = [];
      rehypeWordhug()(tree, { message: (reason: string) => messages.push(reason) });
      expect(tree.children.map((child) => ("value" in child ? child.value : child.tagName))).toEqual(["[a ", "a"]);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain("<a> can't be split");
    });
  });
});

describe("rehypeWordhug whitespace", () => {
  it("keeps the spaces at the edges of an inline element", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [
            { type: "text", value: "Read" },
            { type: "element", tagName: "em", properties: {}, children: [{ type: "text", value: " [the guide] " }] },
            { type: "text", value: "now" },
          ],
        },
      ],
    };
    rehypeWordhug()(tree);
    const em = tree.children[0]!.children[1] as { children: { type: string; value?: string }[] };
    expect(em.children.map((child) => child.value ?? child.type)).toEqual([" ", "element", " "]);
  });
});
