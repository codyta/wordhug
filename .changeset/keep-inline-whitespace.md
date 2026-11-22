---
"wordhug": patch
---

In markdown (`wordhug/rehype`) and Astro children, spaces at the edges of an inline element such as `<em>` or `<strong>` are kept, so `Read<em> [the guide] </em>now` no longer runs the words together. Whitespace outside groups is left as written; only a group's own edges are trimmed.
