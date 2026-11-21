---
"wordhug": minor
---

The Astro `WordHug` reads its children when there is no `text` prop, and a new `wordhugMarkup` function groups brackets in any HTML string.

```astro
<h1><WordHug>Fresh bread [delivered daily] to [your door]</WordHug></h1>
<p><WordHug class="nowrap">Buy [only <strong>{price}</strong> today]</WordHug></p>
```

- Elements and `{expressions}` in the children stay where they are, and a group can contain them. Brackets inside an element are read within that element only.
- Code, `<pre>`, `<script>`, `<style>` and hydrated islands (`<astro-island>`) are left alone, so islands still hydrate.
- The `text` prop still works and wins when both are given.
- `wordhugMarkup(html, options)`, exported from `wordhug`, does the same for HTML you already have, such as HTML from a CMS: brackets are read in the text only, and tags, attributes, comments and entities are kept as they are. Its input isn't escaped or sanitized, so only pass HTML you trust; for plain text, keep using `wordhugHtml`, which escapes.

Docs: https://codyta.github.io/wordhug/frameworks/astro/
