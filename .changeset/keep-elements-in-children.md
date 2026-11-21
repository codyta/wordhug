---
"wordhug": minor
---

React and Vue `WordHug` now keep elements and components in their children instead of dropping them, so `<WordHug>Buy [only <b>$9</b> today]</WordHug>` renders the bold price inside the group. Each element is kept whole; brackets inside an element are not read. React's `wordhug()` accepts the same children. If you relied on elements being dropped, remove them from the children.
