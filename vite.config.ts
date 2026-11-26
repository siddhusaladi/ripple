import { defineConfig } from "vite";

// Relative base so the production build works from any static host or file path.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    // Phaser alone is ~1.2 MB minified; this is expected for a Phaser game.
    chunkSizeWarningLimit: 1600,
  },
});
