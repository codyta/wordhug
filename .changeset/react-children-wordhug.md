---
"wordhug": minor
---

Add a `wordhug(text, options)` function to `wordhug/react`, `wordhug/vue` and `wordhug/solid` that returns the same output as `<WordHug>` as a React node, Vue VNode or Solid element, plus a `WordHugOptions` type for each. React's `WordHug` now also accepts any React children and reads their text, so JSX expressions work inside brackets (`Hello [{name}]`); other elements are ignored.
