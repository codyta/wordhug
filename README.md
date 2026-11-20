# wordhug

Keep phrases together on one line. Put square brackets around a phrase and it is wrapped in an inline-block element, so it moves to the next line as one unit instead of breaking in the middle. Works with React, Vue, Solid, Svelte and Astro, or as a plain HTML string.

```tsx
<WordHug>{"Hello [big world] today"}</WordHug>
// → Hello <span style="display: inline-block">big world</span> today
```

Useful for headings and short copy where a line break would split a name, a price, or a phrase that should read as one unit.

## Why

wordhug started with Vietnamese. Many Vietnamese words are compounds of several syllables written with spaces between them, like *ăn mặc* (to dress), *học sinh* (student) or *Hà Nội*. To a browser every syllable is a separate word, so a line can break in the middle of one, even in a nicely balanced heading:

```
Mẹo chọn đồ giúp bạn ăn
mặc đẹp hơn mỗi ngày
```

"Outfit tips to help you dress better every day" now opens with *Mẹo chọn đồ giúp bạn ăn*, "outfit tips to help you eat". A bad break doesn't just look untidy; it can change what the sentence says.

Content writers and designers usually know exactly where a line should and shouldn't break. The common fix has been a hard `<br />`, but that:

- **mixes presentation into content:** a visual choice becomes part of the text's markup and meaning;
- **fits only one layout:** a break placed for a wide screen lands in the wrong spot on a phone;
- **makes copying messy:** copied text picks up stray line breaks.

wordhug flips the approach: instead of saying where to break, you mark what belongs together. The text still wraps naturally at any width, just never inside a group:

```tsx
<WordHug>{"Mẹo chọn đồ giúp bạn [ăn mặc] đẹp hơn mỗi ngày"}</WordHug>
```

```
Mẹo chọn đồ giúp bạn
ăn mặc đẹp hơn mỗi ngày
```

It works with `text-wrap: balance` too: the browser still balances the lines, treating each group as a single word.

The same applies in any language: names, prices, dates and short phrases that read as one unit.

## Install

```bash
npm install wordhug
```

Each framework is an optional peer dependency; install only the one you use.

| Framework | Import from      | Peer dependency               | Text goes in   |
| --------- | ---------------- | ----------------------------- | -------------- |
| React     | `wordhug/react`  | `react` 18+                   | `children`     |
| Vue       | `wordhug/vue`    | `vue` 3.3+                    | default slot   |
| Solid     | `wordhug/solid`  | `solid-js` and `@solidjs/web` 2+ | `children`  |
| Svelte    | `wordhug/svelte` | `svelte` 5+                   | `text` prop    |
| Astro     | `wordhug/astro`  | –                             | `text` prop    |
| None      | `wordhug`        | –                             | `wordhugHtml` |

### Upgrading from 0.1

The React component moved to its own subpath. Change the import:

```diff
- import { WordHug } from "wordhug";
+ import { WordHug } from "wordhug/react";
```

`parseBrackets` is still imported from `wordhug`.

## Usage

### React

```tsx
import { WordHug } from "wordhug/react";

export function Hero() {
  return (
    <h1>
      <WordHug>{"Fresh bread [delivered daily] to [your door]"}</WordHug>
    </h1>
  );
}
```

`WordHug` has no hooks and no `"use client"` directive, so it renders in React Server Components as well as on the client.

| Prop        | Type                          | Default                       | Description                          |
| ----------- | ----------------------------- | ----------------------------- | ------------------------------------ |
| `children`  | `React.ReactNode`             | –                             | Text to render (see below). Empty input renders nothing. |
| `as`        | `React.ElementType`           | `"span"`                      | Element that wraps each group.       |
| `className` | `string`                      | –                             | Class name on each group wrapper.    |
| `style`     | `CSSProperties \| null`       | `{ display: "inline-block" }` | Inline style on each group wrapper. Pass `null` to style groups only through `className`. |

Children are read as text: strings and numbers are joined, including inside arrays and fragments, so JSX expressions work inside brackets. Other elements are ignored, so put formatting on the groups through `as` or `className` instead.

```tsx
<WordHug>Hello [{user.name}], you have [{count} new messages]</WordHug>
```

#### `wordhug()`

The same thing as a function that returns a React node, for places where a component is awkward, such as props that take a node or text built in a loop. It takes the same input as `children` and the same options as the props.

```tsx
import { wordhug } from "wordhug/react";

<Button label={wordhug("Save [all changes]")} />;
wordhug("Pay [only $9.99]", { className: "nowrap", style: null });
```

### Vue

```vue
<script setup>
import { WordHug } from "wordhug/vue";
</script>

<template>
  <h1><WordHug class="nowrap">Fresh bread [delivered daily] to [your door]</WordHug></h1>
</template>
```

The text comes from the default slot (plain text and `{{ }}` interpolations; elements in the slot are ignored). `class` and `style` go on each group wrapper, not on a root element. `style` defaults to `display: inline-block`; `:style="null"` removes it. `as` takes a tag name or a component and defaults to `"span"`.

`wordhug(text, options)` returns the same output as a VNode, for render functions, Vue JSX or anything that expects a VNode. Options are `as`, `class` and `style`, as for the component:

```ts
import { h } from "vue";
import { wordhug } from "wordhug/vue";

h("h1", [wordhug("Fresh bread [delivered daily]", { class: "nowrap" })]);
```

### Solid

```tsx
import { WordHug } from "wordhug/solid";

<h1>
  <WordHug class="nowrap">{"Fresh bread [delivered daily] to [your door]"}</WordHug>
</h1>;
```

Props: `children` (string), `as` (tag or component, default `"span"`), `class`, and `style` (object or string, default `{ display: "inline-block" }`, `null` removes it). Re-renders when any prop changes. Requires Solid 2.

`wordhug(text, options)` returns the same output as a `JSX.Element`, for props that take an element or text built in a loop. It reads its arguments once, so call it inside JSX (`{wordhug(title())}`) or a memo to keep it reactive:

```tsx
import { wordhug } from "wordhug/solid";

<Button label={wordhug("Save [all changes]", { class: "nowrap" })} />;
```

### Svelte

```svelte
<script>
  import { WordHug } from "wordhug/svelte";
</script>

<h1><WordHug text="Fresh bread [delivered daily] to [your door]" /></h1>
```

Props: `text` (string), `as` (tag name, default `"span"`), `class`, and `style` (string, default `"display: inline-block"`, `null` removes it). Requires Svelte 5; the component ships as source and is compiled by your build.

### Astro

```astro
---
import WordHug from "wordhug/astro";
---

<h1><WordHug text="Fresh bread [delivered daily] to [your door]" /></h1>
```

Same props as Svelte: `text`, `as`, `class`, `style`. Renders static HTML with no client JavaScript.

### Plain HTML: `wordhugHtml`

```ts
import { wordhugHtml } from "wordhug";

wordhugHtml("Fish & [chips]", { class: "nowrap" });
// → 'Fish &amp; <span class="nowrap" style="display: inline-block">chips</span>'
```

Options are `as` (tag name), `class` and `style`, as for Svelte. Text and attributes are HTML-escaped, so the result is safe to insert with `innerHTML`.

This was called `renderToHtml` before 0.3. The old name still works but is deprecated and will be removed in a future release.

### Styling

Groups work without any stylesheet: each wrapper gets `display: inline-block` inline. To use a class instead (for example Tailwind's `inline-block` or `whitespace-nowrap`), pass a class and a `null` style.

An inline-block group moves to the next line as a whole. If a group is wider than its container, it still wraps inside its own box rather than overflowing. Use `white-space: nowrap` if you would rather it never break and overflow instead. Note that a parent's `text-decoration` (such as a link underline) does not carry into inline-block groups.

### Parsing rules

- `[...]` marks a group. Groups can nest: `[a [b c] d]`.
- A bracket without a partner is kept as literal text: `a ] b` and `a [ b` render unchanged.
- Runs of whitespace collapse to a single space, and whitespace at the start and end of the text and of each group is removed.
- Text touching a bracket stays attached: `(see [page 3])` renders `(see <span>page 3</span>)`.
- Empty groups (`[]`) are dropped.
- To show a literal bracket, put a backslash before it: `\[sic\]` renders `[sic]` and never forms a group. A backslash before any other character is kept as is.

In JSX text, Vue and Svelte templates and Astro attributes a backslash is literal, so `<WordHug>Quote \[sic\]</WordHug>` and `text="Quote \[sic\]"` work as written. Inside a JavaScript string the backslash itself needs escaping: `{"Quote \\[sic\\]"}`.

### `parseBrackets`

The parser is exported from the package root, which imports no framework, so you can render the tree any way you like.

```ts
import { parseBrackets } from "wordhug";

parseBrackets("Hello [big world] today");
// [
//   { type: "text", value: "Hello " },
//   { type: "group", children: [{ type: "text", value: "big world" }] },
//   { type: "text", value: " today" },
// ]
```

Types `Node`, `TextNode`, `GroupNode` and `WordhugHtmlOptions` are exported from `wordhug`; `WordHugProps` is exported from `wordhug/react`, `wordhug/solid` and `wordhug/svelte`, and `WordHugOptions` from `wordhug/react`, `wordhug/vue` and `wordhug/solid`.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

Layout tests run in headless Chromium and check that groups really stay on one line:

```bash
npx playwright install chromium
npm run test:browser
```

## License

MIT
