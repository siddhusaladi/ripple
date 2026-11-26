import { defineConfig } from "vitest/config";

// Tests run in plain Node (no DOM, no Phaser) to prove the simulation is headless.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
