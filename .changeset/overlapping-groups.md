---
"wordhug": minor
---

In markdown (`wordhug/rehype`) and Astro children, a group can now start in one formatting element and end in another, as in `**a [b** c]`: bold, italic and similar elements are split at the bracket so the group fits. When a link or another element that can't be split is in the way, the brackets stay as text and a warning is reported (a vfile message from rehype, a console warning in Astro development). Previously such brackets always stayed as text.
