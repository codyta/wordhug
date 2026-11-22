import { describe, expect, it } from "vitest";
import { wordhugMarkup } from "../src/markup";

const G = '<span style="display: inline-block">';

describe("wordhugMarkup", () => {
  it("groups brackets in text and keeps entities as they are", () => {
    expect(wordhugMarkup("Fish &amp; [chips &lt;now&gt;]")).toBe(`Fish &amp; ${G}chips &lt;now&gt;</span>`);
  });

  it("lets a group contain inline elements", () => {
    expect(wordhugMarkup('Buy [only <strong class="x">$9</strong> today]')).toBe(
      `Buy ${G}only <strong class="x">$9</strong> today</span>`,
    );
  });

  it("reads brackets inside elements, within that element only", () => {
    expect(wordhugMarkup("<p>a [b c]</p><p>[d</p><p>e]</p>")).toBe(`<p>a ${G}b c</span></p><p>[d</p><p>e]</p>`);

  });

  it("never reads brackets in tags, attributes or comments", () => {
    const html = '<a href="/x?[1]" title=\'[a > b]\'>link</a><!-- [c] --><img alt="[d]"> [e]';
    expect(wordhugMarkup(html)).toBe(`<a href="/x?[1]" title='[a > b]'>link</a><!-- [c] --><img alt="[d]"> ${G}e</span>`);
  });

  it("leaves code, pre, script and similar elements alone", () => {
    const html =
      "<code>[a]</code> <pre> [b] <code>[c]</code></pre> <script>if (a < b) x = [1]</script> <svg><text>[d]</text></svg> [e]";
    expect(wordhugMarkup(html)).toBe(
      "<code>[a]</code> <pre> [b] <code>[c]</code></pre> <script>if (a < b) x = [1]</script> <svg><text>[d]</text></svg> " +
        `${G}e</span>`,
    );
  });

  it("leaves Astro islands alone, so hydration still matches", () => {
    const html = '<astro-island uid="1"><button>[a]</button></astro-island> [b]';
    expect(wordhugMarkup(html)).toBe(`<astro-island uid="1"><button>[a]</button></astro-island> ${G}b</span>`);
  });

  it("leaves text without groups exactly as it was", () => {
    const html = "<p>\n  a ] b [ c &#91;d&#93;\n</p>";
    expect(wordhugMarkup(html)).toBe(html);
  });

  it("supports escapes, nesting and options", () => {
    expect(wordhugMarkup("\\[sic\\]")).toBe("[sic]");
    expect(wordhugMarkup("[a [b]]", { as: "b", class: "n", style: null })).toBe('<b class="n">a <b class="n">b</b></b>');
    expect(() => wordhugMarkup("[a]", { as: "x y" })).toThrow(TypeError);
  });

  it("copes with loose markup", () => {
    expect(wordhugMarkup("a < b [c]")).toBe(`a < b ${G}c</span>`);
    expect(wordhugMarkup("<p>[a] <i>b</p> [c]")).toBe(`<p>${G}a</span> <i>b</p> ${G}c</span>`);
    expect(wordhugMarkup("</div> [a]")).toBe(`</div> ${G}a</span>`);
    expect(wordhugMarkup("<div>[a] <p>[b]")).toBe(`<div>${G}a</span> <p>${G}b</span>`);
    expect(wordhugMarkup("<code>[a]")).toBe("<code>[a]");
  });

  it("renders nothing for empty input", () => {
    for (const html of [null, undefined, ""]) expect(wordhugMarkup(html)).toBe("");
  });

  describe("groups that start and end in different elements", () => {
    it("splits formatting elements at the brackets so the group fits", () => {
      expect(wordhugMarkup("[a <b>c] d</b>")).toBe(`${G}a <b>c</b></span><b> d</b>`);
      expect(wordhugMarkup("<p><strong>a [b</strong> c]</p>")).toBe(
        `<p><strong>a </strong>${G}<strong>b</strong> c</span></p>`,
      );
    });

    it("copies the element's attributes into both halves", () => {
      expect(wordhugMarkup('<span class="italic">a [b</span> c]')).toBe(
        `<span class="italic">a </span>${G}<span class="italic">b</span> c</span>`,
      );
    });

    it("splits nested formatting", () => {
      expect(wordhugMarkup("<em><em>Overlapping <em>[text</em></em> style]</em>")).toBe(
        `<em><em>Overlapping </em>${G}<em><em>text</em></em> style</span></em>`,
      );
    });

    it("keeps brackets as text and warns when a link, an id or an unclosed element is in the way", () => {
      const warnings: string[] = [];
      const onWarning = (message: string) => warnings.push(message);
      for (const html of ["[a <a href=u>b] c</a>", '[a <em id="x">b] c</em>', "[a <em>b] c"]) {
        expect(wordhugMarkup(html, { onWarning })).toBe(html);
      }
      expect(warnings).toHaveLength(3);
      expect(warnings[0]).toBe(
        'wordhug: the group "[a b]" starts and ends in different elements, and <a> can\'t be split, ' +
          "so its brackets are kept as text. Put both brackets inside <a> or both outside it.",
      );
    });

    it("doesn't warn when nothing crosses", () => {
      const warnings: string[] = [];
      wordhugMarkup("<p>[a <b>b</b>]</p> <em>[c]</em>", { onWarning: (m) => warnings.push(m) });
      expect(warnings).toEqual([]);
    });
  });
});

describe("wordhugMarkup whitespace", () => {
  it("keeps the spaces at the edges of an inline element", () => {
    expect(wordhugMarkup("Read<em> [the guide] </em>now")).toBe(`Read<em> ${G}the guide</span> </em>now`);
  });

  it("leaves whitespace around groups as written and trims only group edges", () => {
    expect(wordhugMarkup("<p>  line one\n   [ a  b ]  </p>")).toBe(`<p>  line one\n   ${G}a  b</span>  </p>`);
  });
});
