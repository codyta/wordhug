---
"wordhug": minor
---

**Breaking:** `wordhugMarkup` is no longer exported from `wordhug`. Its input isn't escaped, and next to `wordhugHtml` it was easy to pick the wrong one. The Astro `WordHug` still reads its children the same way. For plain text, use `wordhugHtml`; for markdown, use `wordhug/rehype`.
