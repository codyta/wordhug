// Svelte and Astro components ship as source; the consumer's compiler builds them.
// They import the parser from "wordhug", so they share dist/index.js with everything else.
import { cp } from "node:fs/promises";

await cp("src/svelte", "dist/svelte", { recursive: true });
await cp("src/astro", "dist/astro", { recursive: true });
