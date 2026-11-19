// Run after `npm run build`: checks that every export in package.json resolves
// from the built package, through both `import` and `require` where they exist.
import { access } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const expected = {
  ".": ["parseBrackets", "wordhugHtml", "renderToHtml"],
  "./react": ["WordHug", "wordhug"],
  "./vue": ["WordHug"],
  "./solid": ["WordHug"],
};

let failed = false;
const fail = (message) => {
  console.error(`✗ ${message}`);
  failed = true;
};

for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (subpath === "./package.json") continue;
  const specifier = pkg.name + subpath.slice(1);
  const files = typeof target === "string" ? [target] : collectFiles(target);
  for (const file of files) {
    await access(new URL(`../${file}`, import.meta.url)).catch(() => fail(`${specifier}: missing ${file}`));
  }
  const names = expected[subpath];
  if (!names) continue;
  const esm = await import(specifier);
  const cjs = require(specifier);
  for (const name of names) {
    // Vue components are objects; everything else here is a function.
    if (esm[name] == null) fail(`${specifier}: import is missing ${name}`);
    if (cjs[name] == null) fail(`${specifier}: require is missing ${name}`);
  }
}

for (const subpath of Object.keys(expected)) {
  if (!(subpath in pkg.exports)) fail(`package.json exports has no ${subpath}`);
}

if (failed) process.exit(1);
console.log(`✓ ${Object.keys(pkg.exports).length - 1} exports resolve from dist`);

function collectFiles(target) {
  return typeof target === "string" ? [target] : Object.values(target).flatMap(collectFiles);
}
