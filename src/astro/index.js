export { default, default as WordHug } from "./WordHug.astro";
// The Astro function returns an escaped HTML string, for `<p set:html={wordhug(text)} />`.
export { wordhugHtml as wordhug } from "wordhug";
