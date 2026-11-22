import { fileURLToPath } from "node:url";
import { getViteConfig } from "astro/config";

// The Astro component needs Astro's Vite plugins to compile, so it gets its own project.
export default getViteConfig({
  resolve: {
    alias: {
      wordhug: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      "#markup": fileURLToPath(new URL("./src/markup.ts", import.meta.url)),
    },
  },
  test: { name: "astro", include: ["test/**/*.astro.test.ts"], environment: "node" },
});
