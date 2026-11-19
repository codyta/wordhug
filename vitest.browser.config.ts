import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Layout tests that need a real browser engine: jsdom doesn't lay out text,
// so it can't tell whether a group actually stays on one line.
// Run with `npm run test:browser` (needs `npx playwright install chromium` once).
export default defineConfig({
  test: {
    name: "layout",
    include: ["test/**/*.browser.test.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
