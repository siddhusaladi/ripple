// Test 8: the simulation runs in plain Node with no Phaser or browser dependency.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HEADLESS_DIRS = ["src/simulation", "src/puzzles"];
const FORBIDDEN = [/from\s+["']phaser["']/, /\bwindow\./, /\bdocument\./, /Math\.random/, /Date\.now/, /performance\.now/];

describe("headless simulation", () => {
  it("runs in a Node environment without DOM globals", async () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
    expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
    const { runSimulation } = await import("../../src/simulation");
    const { PUZZLE_001 } = await import("../../src/puzzles");
    expect(runSimulation(PUZZLE_001, null).endTick).toBe(12);
  });

  it("has no Phaser, DOM, clock, or randomness references in simulation code", () => {
    for (const dir of HEADLESS_DIRS) {
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
        const source = readFileSync(join(dir, file), "utf8");
        for (const pattern of FORBIDDEN) expect(source, `${dir}/${file} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("runs from a separate Node process via the headless demo", () => {
    const out = execFileSync(process.execPath, ["--import", "tsx", "scripts/demo-headless.ts", "trash_can"], {
      encoding: "utf8",
    });
    expect(out).toContain("tick 16: Maya entered the crossing");
    expect(out).toContain("result: survived (end tick 21)");
  });
});
