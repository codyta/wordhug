# wordhug

A small React library: `<WordHug>` wraps `[bracketed phrases]` in inline-block spans so they wrap as one unit. `parseBrackets` (in `src/parse.ts`) is the React-free parser; `src/word-hug.tsx` renders its tree. Published to npm as `wordhug`.

## Commands

- `npm test`: Vitest, once
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: tsup, writes ESM, CJS and types to `dist/`
- `npm run changeset`: add a changeset (interactive)

Run typecheck and tests before finishing any code change.

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

1. If changesets are pending, it opens or updates a **Version Packages** PR that bumps `package.json`, writes `CHANGELOG.md` and deletes the changeset files.
2. Merging that PR pushes to `main` again. Now the version in `package.json` isn't on npm yet, so the workflow typechecks, tests, builds, packs and publishes it with npm trusted publishing (no npm token), then creates the `vX.Y.Z` git tag and GitHub release.
3. Otherwise it does nothing.

`.github/workflows/ci.yml` separately runs typecheck, tests and build on PRs and pushes, on Node 22 and 24.

### One-time setup (done by the maintainer, not Claude)

- npm: the package must exist before trusted publishing can be configured, so the first `0.1.0` publish is done by hand (`npm publish`). Then on npmjs.com, package settings → Trusted publishing: GitHub Actions, repository `codyta/wordhug`, workflow `release.yml`.
- GitHub: Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".

## Conventions

- Keep the package free of runtime dependencies; React is a peer dependency only.
- `WordHug` must stay hook-free with no `"use client"`, so it works in React Server Components.
- When parsing rules or props change, update the README's "Parsing rules" or "Props" section in the same change.
