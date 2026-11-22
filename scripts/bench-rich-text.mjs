// Times wordhugRichText on large inputs. Run `npm run build` first, then `npm run bench`.
import { performance } from "node:perf_hooks";
import { wordhugRichText } from "../dist/index.js";

// Shapes like a ProseMirror or TipTap document.
const text = (value, bold = false) => ({ type: "text", text: value, marks: bold ? [{ type: "bold" }] : [] });

const cases = {
  // A large document, mostly plain: 10,000 paragraphs, one in ten with a group.
  "10,000 paragraphs, 10% with groups": () => {
    const doc = Array.from({ length: 10_000 }, (_, i) =>
      i % 10 === 0
        ? [text("Mẹo chọn đồ giúp bạn "), text("[ăn mặc ", true), text("đẹp] hơn mỗi ngày")]
        : [text("Fresh bread delivered daily to your door, "), text("only $3", true), text(" a loaf.")],
    );
    return () => {
      for (const paragraph of doc) wordhugRichText(paragraph);
    };
  },
  "one paragraph, 2,000 nodes, 1,000 groups": () => {
    const busy = Array.from({ length: 2_000 }, (_, i) => text(i % 2 ? "[ăn mặc " : "đẹp] hơn ", i % 3 === 0));
    return () => wordhugRichText(busy);
  },
  "groups nested 500 deep": () => {
    const deep = [text("[".repeat(500) + "a" + "]".repeat(500))];
    return () => wordhugRichText(deep);
  },
  "100 links as marks, each cut by a group": () => {
    const isLink = (node) => node.marks.some((mark) => mark.type === "link");
    const link = (value) => ({ type: "text", text: value, marks: [{ type: "link" }] });
    const nodes = Array.from({ length: 100 }, () => [text("[see the "), link("menu] page")]).flat();
    return () => wordhugRichText(nodes, { isLink });
  },
};

for (const [name, setup] of Object.entries(cases)) {
  const run = setup();
  for (let i = 0; i < 20; i++) run(); // warm up
  const times = [];
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  console.log(`${name.padEnd(44)} median ${median.toFixed(2).padStart(7)} ms   fastest ${times[0].toFixed(2).padStart(7)} ms`);
}
