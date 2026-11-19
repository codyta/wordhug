# wordhug

## 0.2.1

### Patch Changes

- bfec499: Fix missing types for `wordhug/react`, `wordhug/vue`, `wordhug/solid` and `wordhug/svelte` in TypeScript projects that use `"moduleResolution": "node"`.

## 0.2.0

### Minor Changes

- 7e5fa14: Add `WordHug` components for Vue (`wordhug/vue`), Solid 2 (`wordhug/solid`), Svelte 5 (`wordhug/svelte`) and Astro (`wordhug/astro`), plus a framework-free `renderToHtml` helper. **Breaking:** the React component moved to `wordhug/react`; change `import { WordHug } from "wordhug"` to `import { WordHug } from "wordhug/react"`. The package root now exports only `parseBrackets`, `renderToHtml` and their types, and every framework is an optional peer dependency.
