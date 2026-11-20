# wordhug

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
