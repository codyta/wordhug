// Lets `tsc` type `.astro` imports in tests; Astro's Vite plugin compiles them at runtime.
declare module "*.astro" {
  import type { experimental_AstroContainer } from "astro/container";
  const Component: Parameters<experimental_AstroContainer["renderToString"]>[0];
  export default Component;
}
