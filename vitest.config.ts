import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // Svelte and Astro components import the parser from the package itself.
    alias: { wordhug: fileURLToPath(new URL("./src/index.ts", import.meta.url)) },
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
