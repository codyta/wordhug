---
"wordhug": minor
---

React: `WordHug` now accepts any React children and reads their text, so JSX expressions work inside brackets (`Hello [{name}]`); other elements are ignored. Add a `wordhug(input, options)` function to `wordhug/react` that returns the same output as a React node, plus a `WordHugOptions` type.
