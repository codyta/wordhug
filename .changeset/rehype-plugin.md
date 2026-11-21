---
"wordhug": minor
---

Add `wordhug/rehype`, a rehype plugin so writers can use brackets in markdown and MDX.

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
