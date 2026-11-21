# wordhug

A small library: `<WordHug>` wraps `[bracketed phrases]` in inline-block spans so they wrap as one unit. `parseBrackets` (in `src/parse.ts`) is the framework-free parser and `wordhugHtml` (`src/html.ts`) renders it to an escaped HTML string; both are exported from the package root. Each framework has its own subpath export: `src/react.tsx`, `src/vue.ts`, `src/solid.ts` (Solid 2, no JSX compiler needed), `src/svelte/` and `src/astro/`. The Svelte and Astro components ship as source (copied to `dist/` by `scripts/copy-components.mjs`) and import the parser from `"wordhug"`, which `vitest.config.ts` aliases to `src/index.ts`. Published to npm as `wordhug`.

## Commands

- `npm test`: Vitest, once
- `npm run test:browser`: layout tests in headless Chromium (`test/*.browser.test.tsx`, `vitest.browser.config.ts`) that check groups really stay on one line. Needs `npx playwright install chromium` once. CI runs it on Node 24
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: tsup, writes ESM, CJS and types to `dist/`, then copies the Svelte and Astro components
- `npm run check:package`: after a build, checks every `exports` entry resolves from `dist/` via `import` and `require`, then runs publint and Are the Types Wrong (`attw`). attw skips `wordhug/astro` (TypeScript can't resolve `.astro` files) and the CJS-to-ESM rule (Svelte is ESM-only). `typesVersions` in `package.json` must list every typed subpath, or types break under `"moduleResolution": "node"`
- Docs site: `docs/` is an Astro Starlight site with its own `package.json` (`npm install --prefix docs`, then `npm run dev --prefix docs` or `npm run build --prefix docs`). It imports wordhug from `src/` through Vite aliases, renders live examples with each framework (Solid 2 at build time in `SolidDemo.astro`, since Astro's Solid integration is Solid 1 only), runs its own markdown through `wordhug/rehype`, and generates the API reference from the TSDoc in `src/` with `starlight-typedoc` (module names come from the `@module` tags). `.github/workflows/docs.yml` publishes it to GitHub Pages on pushes to `main`. It isn't published to npm and needs no changeset, but when a feature, prop or parsing rule changes, update its docs page in the same PR as the README
- `npm run changeset`: add a changeset (interactive)

Run typecheck and tests before finishing any code change.

Tests run as three Vitest projects: `server` (`test/*.test.ts`, Node), `dom` (`*.dom.test.ts[x]` and `*.dom.test.svelte.ts`, jsdom with the browser builds of Solid and Svelte) and `astro` (`*.astro.test.ts`, configured in `vitest.astro.config.ts`). Each framework has a server test and, except Astro, a browser test that checks updates.

## Versioning and releases

Versions and `CHANGELOG.md` are managed by [Changesets](https://changesets.dev) v3. Never edit `version` in `package.json` or `CHANGELOG.md` by hand, and never run `npm publish` or `npm version`. CI does that.

### Adding a changeset

Every change that affects what users of the package get (anything in `src/`, `package.json` exports or peer dependencies, or behaviour described in the README) needs a changeset in the same PR. Tests, CI, docs-only and tooling changes do not.

`npx changeset` is interactive, so write the file directly instead: `.changeset/<short-kebab-name>.md`:

```md
---
"wordhug": minor
---

Add `foo` prop to control bar.
```

The body becomes the changelog entry: one or two sentences in the past or present tense, written for users of the package, not about the implementation.

Picking the bump while the version is `0.x`:

- `patch`: bug fixes and internal changes users can't observe
- `minor`: new features, and also breaking changes (parsing rules, props, exports) while below 1.0. Say clearly in the changeset body when a change is breaking.
- `major`: only when the user decides the API is stable and asks for 1.0.0

After 1.0, follow normal semver: breaking changes are `major`.

### How a release happens

`.github/workflows/release.yml` runs on every push to `main`:

1. If changesets are pending, it opens or updates a **Version Packages** PR that bumps `package.json`, writes `CHANGELOG.md` and deletes the changeset files. It pushes as the release GitHub App, so CI runs on that PR like any other.
2. Merging that PR pushes to `main` again. Now the version in `package.json` isn't on npm yet, so the workflow typechecks, tests, builds, packs and publishes it with npm trusted publishing (no npm token), then creates the `vX.Y.Z` git tag and GitHub release.
3. Otherwise it does nothing.

`.github/workflows/ci.yml` separately runs typecheck, tests and build on PRs and pushes, on Node 22 and 24.

### One-time setup (done by the maintainer, not Claude)

- npm: the package must exist before trusted publishing can be configured, so the first `0.1.0` publish is done by hand (`npm publish`). Then on npmjs.com, package settings → Trusted publishing: GitHub Actions, repository `codyta/wordhug`, workflow `release.yml`, "Allow npm publish" ticked.
- GitHub App for releases: a GitHub App owned by the maintainer, with repository permissions Contents and Pull requests set to read & write, installed on `codyta/wordhug` only. Its Client ID is the repository variable `RELEASE_APP_CLIENT_ID` and its private key the repository secret `RELEASE_APP_PRIVATE_KEY`. Without them the `version` job fails.

## Repository safeguards

- `main` is protected by a ruleset: changes land only through PRs, the `test (22)` and `test (24)` CI checks must pass, and force-pushes and deletion are blocked. Always work on a branch and open a PR; never push to `main` or try to bypass the rules.
- PRs are squash-merged and their branches deleted after merge.
- The **Version Packages** PR is merged like any other PR once CI passes. Merging it publishes to npm, so it's the maintainer's call when to merge it. The admin bypass is for emergencies only.
- Dependabot opens grouped weekly PRs for npm and GitHub Actions updates. Dev-dependency and Actions updates need no changeset. TypeScript stays on 6 (tsup can't build `.d.ts` files with TypeScript 7), so Dependabot ignores TypeScript and `@types/node` major updates.
- Security reports go through GitHub private vulnerability reporting (see `SECURITY.md`).

## Conventions

- Keep the package free of runtime dependencies; frameworks are optional peer dependencies only, and the package root must never import one.
- The React `WordHug` must stay hook-free with no `"use client"`, so it works in React Server Components.
- Keep the framework components' behaviour in step: a parsing or prop change applies to every adapter and its tests.
- When parsing rules or props change, update the README's "Parsing rules" or the framework's usage section in the same change.
