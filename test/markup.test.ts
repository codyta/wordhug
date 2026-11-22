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
    expect(wordhugMarkup("[a <b>c] d</b>")).toBe("[a <b>c] d</b>");
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
});

describe("wordhugMarkup whitespace", () => {
  it("keeps the spaces at the edges of an inline element", () => {
    expect(wordhugMarkup("Read<em> [the guide] </em>now")).toBe(`Read<em> ${G}the guide</span> </em>now`);
  });

  it("leaves whitespace around groups as written and trims only group edges", () => {
    expect(wordhugMarkup("<p>  line one\n   [ a  b ]  </p>")).toBe(`<p>  line one\n   ${G}a  b</span>  </p>`);
  });
});
