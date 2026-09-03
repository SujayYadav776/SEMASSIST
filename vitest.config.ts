import { defineConfig } from "vitest/config";

// Standalone test config: deliberately does NOT extend vite.config.ts so the
// dev/build plugins (react, tailwind, manus runtime/debug collector) never run
// during tests. Study-dashboard tests create their own DOM via jsdom.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
