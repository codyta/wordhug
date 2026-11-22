// @ts-check
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import rehypeWordhug from "../src/rehype.ts";

// The docs use wordhug from the local source, so every example shows the code in this branch.
/** @param {string} file */
const src = (file) => fileURLToPath(new URL(`../src/${file}`, import.meta.url));

export default defineConfig({
  site: "https://codyta.github.io",
  base: "/wordhug",
  // The docs' own prose uses wordhug: [brackets] in markdown become groups.
  markdown: { rehypePlugins: [rehypeWordhug] },
  integrations: [
    starlight({
      title: "wordhug",
      description: "Keep phrases together on one line, in any framework.",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/codyta/wordhug" }],
      editLink: { baseUrl: "https://github.com/codyta/wordhug/edit/main/docs/" },
      customCss: ["./src/styles/custom.css"],
      plugins: [
        starlightTypeDoc({
          entryPoints: ["../src/index.ts", "../src/react.tsx", "../src/vue.ts", "../src/solid.ts", "../src/rehype.ts"],
          tsconfig: "../tsconfig.json",
          output: "reference/api",
          sidebar: { label: "API reference", collapsed: true },
          typeDoc: { excludeInternal: true, excludePrivate: true, readme: "none" },
        }),
      ],
      sidebar: [
        { label: "Start here", items: ["getting-started", "why", "parsing-rules", "styling"] },
        {
          label: "Frameworks",
          items: ["frameworks/react", "frameworks/vue", "frameworks/solid", "frameworks/svelte", "frameworks/astro"],
        },
        { label: "Without a framework", items: ["guides/html", "guides/markdown", "guides/parser"] },
        typeDocSidebarGroup,
      ],
    }),
    react(),
    vue(),
    svelte(),
  ],
  vite: {
    resolve: {
      alias: [
        { find: /^wordhug$/, replacement: src("index.ts") },
        { find: /^wordhug\/react$/, replacement: src("react.tsx") },
        { find: /^wordhug\/vue$/, replacement: src("vue.ts") },
        { find: /^wordhug\/solid$/, replacement: src("solid.ts") },
        { find: /^wordhug\/svelte$/, replacement: src("svelte/index.js") },
        { find: /^wordhug\/astro$/, replacement: src("astro/WordHug.astro") },
        { find: /^wordhug\/rehype$/, replacement: src("rehype.ts") },
        // The Astro component's private import of wordhugMarkup.
        { find: /^#markup$/, replacement: src("markup.ts") },
      ],
    },
  },
});
