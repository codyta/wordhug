# wordhug

## 0.5.0

### Minor Changes

- 755a9fd: The Astro `WordHug` reads its children when there is no `text` prop, and a new `wordhugMarkup` function groups brackets in any HTML string.
  
  ```astro
  <h1><WordHug>Fresh bread [delivered daily] to [your door]</WordHug></h1>
  <p><WordHug class="nowrap">Buy [only <strong>{price}</strong> today]</WordHug></p>
  ```
  
  - Elements and `{expressions}` in the children stay where they are, and a group can contain them. Brackets inside an element are read within that element only.
  - Code, `<pre>`, `<script>`, `<style>` and hydrated islands (`<astro-island>`) are left alone, so islands still hydrate.
  - The `text` prop still works and wins when both are given.
  - `wordhugMarkup(html, options)`, exported from `wordhug`, does the same for HTML you already have, such as HTML from a CMS: brackets are read in the text only, and tags, attributes, comments and entities are kept as they are. Its input isn't escaped or sanitized, so only pass HTML you trust; for plain text, keep using `wordhugHtml`, which escapes.
  
  Docs: https://codyta.github.io/wordhug/frameworks/astro/
- a6ef1c7: Add `wordhug/rehype`, a rehype plugin so writers can use brackets in markdown and MDX.
  
  ```js
  // astro.config.mjs
  import rehypeWordhug from "wordhug/rehype";
  
  export default { markdown: { rehypePlugins: [rehypeWordhug] } };
  ```
  
  - Works in any unified pipeline: Astro's markdown and MDX, `@next/mdx`, `@mdx-js/mdx` and many CMS pipelines.
  - Runs after markdown is parsed, so links (`[text](url)`), references, footnotes and task list boxes are left alone; only brackets left in the text become groups.
  - A group can contain inline formatting such as `**bold**`. Code spans, code blocks, `<pre>`, `<script>` and `<style>` are never read, and text without groups is left exactly as it was.
  - Takes the same `as`, `class` and `style` options as `wordhugHtml`.
  - Markdown removes one backslash before a bracket, so write `\\[sic\\]` for a literal bracket.
  - On Astro 7, also install `@astrojs/markdown-remark`: Astro's new default markdown processor doesn't run rehype plugins.
  
  Docs: https://codyta.github.io/wordhug/guides/markdown/

## 0.4.0

### Minor Changes

- c1c436c: React and Vue `WordHug` now keep elements and components in their children instead of dropping them, so `<WordHug>Buy [only <b>$9</b> today]</WordHug>` renders the bold price inside the group. Each element is kept whole; brackets inside an element are not read. React's `wordhug()` accepts the same children. If you relied on elements being dropped, remove them from the children.

## 0.3.0

### Minor Changes

- 8157b7e: Add a `wordhug(text, options)` function to `wordhug/react`, `wordhug/vue` and `wordhug/solid` that returns the same output as `<WordHug>` as a React node, Vue VNode or Solid element, plus a `WordHugOptions` type for each. React's `WordHug` now also accepts any React children and reads their text, so JSX expressions work inside brackets (`Hello [{name}]`); other elements are ignored.
- 9c98fd2: Rename `renderToHtml` to `wordhugHtml` (and `RenderToHtmlOptions` to `WordhugHtmlOptions`), so the name says what it renders. The old names still work but are deprecated and will be removed in a future release.

## 0.2.1

### Patch Changes

- bfec499: Fix missing types for `wordhug/react`, `wordhug/vue`, `wordhug/solid` and `wordhug/svelte` in TypeScript projects that use `"moduleResolution": "node"`.

## 0.2.0

### Minor Changes

- 7e5fa14: Add `WordHug` components for Vue (`wordhug/vue`), Solid 2 (`wordhug/solid`), Svelte 5 (`wordhug/svelte`) and Astro (`wordhug/astro`), plus a framework-free `renderToHtml` helper. **Breaking:** the React component moved to `wordhug/react`; change `import { WordHug } from "wordhug"` to `import { WordHug } from "wordhug/react"`. The package root now exports only `parseBrackets`, `renderToHtml` and their types, and every framework is an optional peer dependency.
