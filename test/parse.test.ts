import { describe, expect, it } from "vitest";
import { parseBrackets, type Node } from "../src/parse";

const t = (value: string): Node => ({ type: "text", value });
const g = (...children: Node[]): Node => ({ type: "group", children });

describe("parseBrackets", () => {
  it("returns plain words as one text node", () => {
    expect(parseBrackets("Hello big world")).toEqual([t("Hello big world")]);
  });

  it("wraps one group", () => {
    expect(parseBrackets("Hello [big world] today")).toEqual([
      t("Hello "),
      g(t("big world")),
      t(" today"),
    ]);
  });

  it("handles nested groups", () => {
    expect(parseBrackets("a [b [c d] e] f")).toEqual([
      t("a "),
      g(t("b "), g(t("c d")), t(" e")),
      t(" f"),
    ]);
  });

  it("returns an empty array for empty or whitespace-only input", () => {
    expect(parseBrackets("")).toEqual([]);
    expect(parseBrackets("   ")).toEqual([]);
    expect(parseBrackets("[ ]")).toEqual([]);
  });

  it("keeps an unmatched [ as literal text", () => {
    expect(parseBrackets("a [b c")).toEqual([t("a [b c")]);
    expect(parseBrackets("[a [b] c")).toEqual([t("[a "), g(t("b")), t(" c")]);
  });

  it("keeps an unmatched ] as literal text and does not drop the rest", () => {
    expect(parseBrackets("a ] b [c] d")).toEqual([
      t("a ] b "),
      g(t("c")),
      t(" d"),
    ]);
    expect(parseBrackets("[a] b] c")).toEqual([g(t("a")), t(" b] c")]);
  });

  it("collapses repeated whitespace and trims the edges", () => {
    expect(parseBrackets("  a   b \n\t[  c   d  ]   e  ")).toEqual([
      t("a b "),
      g(t("c d")),
      t(" e"),
    ]);
  });

  it("keeps text that touches a bracket attached", () => {
    expect(parseBrackets("(see [page 3])")).toEqual([
      t("(see "),
      g(t("page 3")),
      t(")"),
    ]);
  });

  it("drops empty groups without doubling spaces", () => {
    expect(parseBrackets("a [] b")).toEqual([t("a b")]);
  });

  it("treats \\[ and \\] as literal brackets", () => {
    expect(parseBrackets("a \\[sic\\] b")).toEqual([t("a [sic] b")]);
    expect(parseBrackets("[see \\[1\\]] now")).toEqual([g(t("see [1]")), t(" now")]);
  });

  it("does not let an escaped bracket close or open a group", () => {
    expect(parseBrackets("[a \\] b]")).toEqual([g(t("a ] b"))]);
    expect(parseBrackets("\\[a] b")).toEqual([t("[a] b")]);
  });

  it("keeps a backslash that is not before a bracket", () => {
    expect(parseBrackets("C:\\Users [a b]")).toEqual([t("C:\\Users "), g(t("a b"))]);
    expect(parseBrackets("a\\\\[b]")).toEqual([t("a\\[b]")]);
  });

  it("handles very deep nesting without overflowing the stack", () => {
    const depth = 100_000;
    let node = parseBrackets("[".repeat(depth) + "x" + "]".repeat(depth))[0];
    for (let i = 1; i < depth; i++) {
      if (node?.type !== "group") throw new Error(`expected a group at depth ${i}`);
      node = node.children[0];
    }
    expect(node).toEqual(g(t("x")));
  });
});
