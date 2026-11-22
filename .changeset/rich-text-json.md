---
"wordhug": minor
---

Add `wordhugRichText`, which finds groups in one paragraph of rich text stored as JSON, such as ProseMirror, TipTap, Lexical, Contentful or Sanity. A group can cover nodes with different formatting. Most formats need no options; `textField`, `keyField`, `isLink` and `createGroup` adapt it to the rest. Inline code is left alone and links are never cut in two.
