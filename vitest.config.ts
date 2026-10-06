import { defineConfig } from "vitest/config";

// Standalone test config: deliberately does NOT extend vite.config.ts so the
// dev/build plugins (react, tailwind, manus runtime/debug collector) never run
// during tests. Study-dashboard tests create their own DOM via jsdom.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // These tests drive real jsdom windows and real debounce timers (250ms
    // saves, 400ms leaderboard refreshes, multi-step auth flows), so a loaded
    // machine can push a single case past the 5s default and fail it on timing
    // rather than behaviour.
    testTimeout: 20000,
  },
});
