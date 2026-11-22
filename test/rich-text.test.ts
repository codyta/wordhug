import { describe, expect, it } from "vitest";
import { wordhugRichText } from "../src/index";

// Sanity's Portable Text: the children of one block.
type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type Mention = { _type: "mention"; _key: string; name: string };
const span = (_key: string, text: string, marks: string[] = []): Span => ({ _type: "span", _key, text, marks });
const mention: Mention = { _type: "mention", _key: "m", name: "Jo" };

describe("wordhugRichText", () => {
  it("groups across nodes with different marks, keeping each piece's marks", () => {
    // **Overlapping *[text** style]*
    const children = [span("a", "Overlapping ", ["strong"]), span("b", "[text", ["strong", "em"]), span("c", " style]", ["em"])];
    expect(wordhugRichText(children)).toEqual([
      span("a", "Overlapping ", ["strong"]),
      { type: "group", children: [span("b", "text", ["strong", "em"]), span("c", " style", ["em"])] },
    ]);
  });

  it("keeps keys unique with keyField: cut pieces get -1, -2 and groups get their own key", () => {
    const children = [span("a", "Fresh bread [delivered daily] to you", ["em"])];
    expect(wordhugRichText(children, { keyField: "_key" })).toEqual([
      span("a", "Fresh bread ", ["em"]),
      { type: "group", _key: "wordhug-0", children: [span("a-1", "delivered daily", ["em"])] },
      span("a-2", " to you", ["em"]),
    ]);
  });

  it("keeps nodes that aren't text whole, inside or outside groups", () => {
    const children: (Span | Mention)[] = [span("a", "Hi [dear "), mention, span("b", "] and "), mention];
    expect(wordhugRichText(children)).toEqual([
      span("a", "Hi "),
      { type: "group", children: [span("a", "dear "), mention] },
      span("b", " and "),
      mention,
    ]);
  });

  it("uses isText to decide which nodes are text", () => {
    const quote = { _type: "quote" as const, _key: "q", text: "[not read]", marks: [] };
    const result = wordhugRichText([span("a", "[a] "), quote], { isText: (child) => child._type === "span" });
    expect(result).toEqual([{ type: "group", children: [span("a", "a")] }, span("a", " "), quote]);
  });

  it("builds groups with createGroup, inferring their type", () => {
    const result = wordhugRichText([span("a", "[a [b]] \\[sic\\]")], {
      keyField: "_key",
      createGroup: (children, { depth }) => ({ _type: "wordhug" as const, depth, children }),
    });
    expect(result).toEqual([
      {
        _type: "wordhug",
        _key: "wordhug-0",
        depth: 0,
        children: [span("a", "a "), { _type: "wordhug", _key: "wordhug-1", depth: 1, children: [span("a-1", "b")] }],
      },
      span("a-2", " [sic]"),
    ]);
    // The result type knows the group shape: no generics needed.
    const group = result.find((node) => node._type === "wordhug");
    expect(group?.depth).toBe(0);
  });

  it("can stay flat when createGroup returns an array, telling groups apart by key", () => {
    const result = wordhugRichText([span("a", "x [b "), span("c", "c][d]", ["strong"])], {
      keyField: "_key",
      createGroup: (children, { key }) => (children as Span[]).map((child) => ({ ...child, marks: [...child.marks, key] })),
    });
    expect(result).toEqual([
      span("a", "x "),
      span("a-1", "b ", ["wordhug-0"]),
      span("c", "c", ["strong", "wordhug-0"]),
      span("c-1", "d", ["strong", "wordhug-1"]),
    ]);
  });

  it("returns the nodes unchanged when there are no groups", () => {
    const children = [span("a", "a ] b [ c"), span("b", "  two  spaces ")];
    const result = wordhugRichText(children);
    expect(result).toEqual(children);
    expect(result[1]).toBe(children[1]);
  });

  it("works with ProseMirror and TipTap with no options", () => {
    type PM = { type: "text"; text: string; marks?: { type: string }[] } | { type: "hardBreak" };
    const content: PM[] = [
      { type: "text", text: "Buy [only ", marks: [] },
      { type: "text", text: "$9", marks: [{ type: "bold" }] },
      { type: "hardBreak" },
      { type: "text", text: " today]" },
    ];
    expect(wordhugRichText(content, { createGroup: (children) => ({ type: "wordhug", content: children }) })).toEqual([
      { type: "text", text: "Buy ", marks: [] },
      {
        type: "wordhug",
        content: [
          { type: "text", text: "only ", marks: [] },
          { type: "text", text: "$9", marks: [{ type: "bold" }] },
          { type: "hardBreak" },
          { type: "text", text: " today" },
        ],
      },
    ]);
  });

  it("works with Contentful through textField, keeping hyperlinks whole", () => {
    type CF =
      | { nodeType: "text"; value: string; marks: { type: string }[]; data: object }
      | { nodeType: "hyperlink"; data: { uri: string }; content: CF[] };
    const text = (value: string, marks: { type: string }[] = []): CF => ({ nodeType: "text", value, marks, data: {} });
    const link: CF = { nodeType: "hyperlink", data: { uri: "/menu" }, content: [text("[menu]")] };
    expect(wordhugRichText([text("See [the ", [{ type: "italic" }]), link, text(" today]")], { textField: "value" })).toEqual([
      text("See ", [{ type: "italic" }]),
      { type: "group", children: [text("the ", [{ type: "italic" }]), link, text(" today")] },
    ]);
  });

  it("works with Lexical with no options", () => {
    type LX = { type: "text"; text: string; format: number } | { type: "link"; url: string; children: LX[] };
    const nodes: LX[] = [
      { type: "text", text: "[Mẹo ", format: 1 },
      { type: "text", text: "chọn]", format: 2 },
    ];
    expect(wordhugRichText(nodes)).toEqual([
      {
        type: "group",
        children: [
          { type: "text", text: "Mẹo ", format: 1 },
          { type: "text", text: "chọn", format: 2 },
        ],
      },
    ]);
  });

  it("works with Notion through getText and setText", () => {
    type RichText =
      | { type: "text"; text: { content: string }; plain_text: string }
      | { type: "mention"; plain_text: string };
    const text = (content: string): RichText => ({ type: "text", text: { content }, plain_text: content });
    const result = wordhugRichText([text("[a "), text("b]")], {
      getText: (item) => (item.type === "text" ? item.text.content : undefined),
      setText: (item, content) => ({ ...item, text: { content }, plain_text: content }),
    });
    expect(result).toEqual([{ type: "group", children: [text("a "), text("b")] }]);
  });

  it("checks field names against the node types", () => {
    // @ts-expect-error: "txt" is not a field of Span.
    wordhugRichText([span("a", "x")], { textField: "txt" });
    expect(wordhugRichText([] as Span[], { keyField: "_key" })).toEqual([]);
  });

  it("keeps whitespace as written, except at a group's edges", () => {
    const result = wordhugRichText([span("a", "  two  spaces [ in  here ]  ")]);
    expect(result).toEqual([span("a", "  two  spaces "), { type: "group", children: [span("a", "in  here")] }, span("a", "  ")]);
  });

  it("returns nodes that didn't change as they are, not copies", () => {
    const before = span("a", "Plain ", ["strong"]);
    const after = span("c", " plain");
    const result = wordhugRichText([before, span("b", "[group]"), after]);
    expect(result[0]).toBe(before);
    expect(result[2]).toBe(after);
  });

  it("leaves inline code alone in the common formats", () => {
    const sanity = { _type: "span", _key: "c", text: "arr[0]", marks: ["code"] };
    expect(wordhugRichText([span("a", "[see "), sanity, span("b", "]")])).toEqual([
      { type: "group", children: [span("a", "see "), sanity] },
    ]);
    const prosemirror = { type: "text", text: "[0]", marks: [{ type: "code" }] };
    expect(wordhugRichText([prosemirror])).toEqual([prosemirror]);
    const slate = { text: "[0]", code: true };
    expect(wordhugRichText([slate])).toEqual([slate]);
    const lexical = { type: "text", text: "[0]", format: 16 };
    expect(wordhugRichText([lexical])).toEqual([lexical]);
  });

  describe("links stored as marks", () => {
    type PM = { type: "text"; text: string; marks: { type: string }[] };
    const text = (value: string, link = false): PM => ({ type: "text", text: value, marks: link ? [{ type: "link" }] : [] });
    const isLink = (node: PM) => node.marks.some((mark) => mark.type === "link");

    it("keeps brackets as text when a group would cut a link in two, and warns", () => {
      const warnings: string[] = [];
      const nodes = [text("[see the "), text("menu] page", true)];
      expect(wordhugRichText(nodes, { isLink, onWarning: (message) => warnings.push(message) })).toEqual(nodes);
      expect(warnings).toEqual([
        'wordhug: the group "[see the menu]" would cut a link in two, so its brackets are kept as text. ' +
          "Put the brackets around the whole link, or outside it.",
      ]);
    });

    it("also keeps a group inside a link from cutting it", () => {
      const nodes = [text("the [daily menu] page", true)];
      expect(wordhugRichText(nodes, { isLink })).toEqual(nodes);
    });

    it("groups around a whole link", () => {
      expect(wordhugRichText([text("[see the "), text("menu", true), text("] now")], { isLink })).toEqual([
        { type: "group", children: [text("see the "), text("menu", true)] },
        text(" now"),
      ]);
    });

    it("still groups the rest of the paragraph", () => {
      const result = wordhugRichText([text("[a] "), text("b [c", true), text("] d", true)], { isLink });
      expect(result[0]).toEqual({ type: "group", children: [text("a")] });
      expect(result.slice(1)).toEqual([text(" "), text("b [c", true), text("] d", true)]);
    });
  });
});

describe("wordhugRichText escapes across nodes", () => {
  it("reads a backslash at the end of a node as escaping a bracket in the next one", () => {
    expect(wordhugRichText([{ text: "a\\" }, { text: "[b c]" }])).toEqual([{ text: "a" }, { text: "[b c]" }]);
  });

  it("doesn't cut a link in two through an escaped bracket", () => {
    const warnings: string[] = [];
    const nodes = [{ text: "see \\" }, { text: "[a ", link: true }, { text: "b] c", link: true }];
    const out = wordhugRichText(nodes, { isLink: (node) => node.link === true, onWarning: (m) => warnings.push(m) });
    expect(out).toEqual([{ text: "see " }, nodes[1], nodes[2]]);
    expect(out.some((node) => "type" in node && node.type === "group")).toBe(false);
  });
});
