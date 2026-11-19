import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

// Svelte and Astro components import the parser from the package itself.
const alias = { wordhug: fileURLToPath(new URL("./src/index.ts", import.meta.url)) };

export default defineConfig({
  plugins: [svelte()],
  test: {
    projects: [
      {
        extends: true,
        resolve: { alias },
        test: {
          name: "server",
          include: ["test/**/*.test.{ts,tsx}"],
          exclude: ["test/**/*.dom.test.{ts,tsx}", "test/**/*.astro.test.ts"],
          environment: "node",
        },
      },
      "./vitest.astro.config.ts",
      {
        extends: true,
        // Load the client builds of Solid and Svelte instead of their server builds.
        resolve: { alias, conditions: ["browser", "development"] },
        test: {
          name: "dom",
          include: ["test/**/*.dom.test.{ts,tsx}", "test/**/*.dom.test.svelte.ts"],
          environment: "jsdom",
          // Bundle these through Vite so the conditions above apply; Node would pick the server builds.
          server: { deps: { inline: ["solid-js", "@solidjs/web", "svelte"] } },
        },
      },
    ],
  },
});
