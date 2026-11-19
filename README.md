# wordhug

Keep phrases together on one line in React. Put square brackets around a phrase and it is wrapped in an inline-block element, so it moves to the next line as one unit instead of breaking in the middle.

```tsx
<WordHug>{"Hello [big world] today"}</WordHug>
// → Hello <span style="display: inline-block">big world</span> today
```

Useful for headings and short copy where a line break would split a name, a price, or a phrase that should read as one unit.

## Install

```bash
npm install wordhug
```

React 18 or later is a peer dependency.

## Usage

```tsx
import { WordHug } from "wordhug";

export function Hero() {
  return (
    <h1>
      <WordHug>{"Fresh bread [delivered daily] to [your door]"}</WordHug>
    </h1>
  );
}
```

`WordHug` has no hooks and no `"use client"` directive, so it renders in React Server Components as well as on the client.

### Props

| Prop        | Type                          | Default                       | Description                          |
| ----------- | ----------------------------- | ----------------------------- | ------------------------------------ |
| `children`  | `string \| null \| undefined` | –                             | Text to render. Empty input renders nothing. |
| `as`        | `React.ElementType`           | `"span"`                      | Element that wraps each group.       |
| `className` | `string`                      | –                             | Class name on each group wrapper.    |
| `style`     | `CSSProperties \| null`       | `{ display: "inline-block" }` | Inline style on each group wrapper. Pass `null` to style groups only through `className`. |

Groups work without any stylesheet: each wrapper gets `display: inline-block` inline. To use a class instead (for example Tailwind's `inline-block` or `whitespace-nowrap`), pass `className` and `style={null}`.

An inline-block group moves to the next line as a whole. If a group is wider than its container, it still wraps inside its own box rather than overflowing. Use `style={{ whiteSpace: "nowrap" }}` if you would rather it never break and overflow instead. Note that a parent's `text-decoration` (such as a link underline) does not carry into inline-block groups.

### Parsing rules

- `[...]` marks a group. Groups can nest: `[a [b c] d]`.
- A bracket without a partner is kept as literal text: `a ] b` and `a [ b` render unchanged.
- Runs of whitespace collapse to a single space, and whitespace at the start and end of the text and of each group is removed.
- Text touching a bracket stays attached: `(see [page 3])` renders `(see <span>page 3</span>)`.
- Empty groups (`[]`) are dropped.
- To show a literal bracket, put a backslash before it: `\[sic\]` renders `[sic]` and never forms a group. A backslash before any other character is kept as is.

In JSX text a backslash is literal, so `<WordHug>Quote \[sic\]</WordHug>` works as written. Inside a JavaScript string the backslash itself needs escaping: `{"Quote \\[sic\\]"}`.

### `parseBrackets`

The parser is exported on its own and does not import React, so you can use the tree with any renderer.

```ts
import { parseBrackets } from "wordhug";

parseBrackets("Hello [big world] today");
// [
//   { type: "text", value: "Hello " },
//   { type: "group", children: [{ type: "text", value: "big world" }] },
//   { type: "text", value: " today" },
// ]
```

Types `Node`, `TextNode`, `GroupNode` and `WordHugProps` are exported too.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

## License

MIT
