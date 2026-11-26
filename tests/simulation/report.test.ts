// The chain-reaction explanation must reflect the actual events of each run.
import { describe, expect, it } from "vitest";
import { runSimulation } from "../../src/simulation";
import { explainRun } from "../../src/simulation/report";
import { PUZZLE_001 } from "../../src/puzzles";

const baseline = runSimulation(PUZZLE_001, null);
const explain = (objectId: string, modificationId: string): string[] =>
  explainRun(PUZZLE_001, runSimulation(PUZZLE_001, { objectId, modificationId }), baseline);

describe("explainRun", () => {
  it("explains the trash can detour", () => {
    expect(explain("trash_can", "move_to_sidewalk")).toEqual([
      "You changed the trash can: Push onto the sidewalk.",
      "Maya's usual route was blocked, so they took a different one (+4 segments).",
      "Maya reached the crossing at t=16 instead of t=12.",
      "The car reached the crossing at t=12, as before.",
      "Maya made it safely at t=20.",
    ]);
  });

  it("explains the signal delay", () => {
    const lines = explain("traffic_light", "retime");
    expect(lines).toContain("The car waited at a red light for 3 s (t=12–14).");
    expect(lines).toContain("The car reached the crossing at t=15 instead of t=12.");
  });

  it("explains a change that does not save Maya", () => {
    const lines = explain("delivery_crate", "move_to_bike_path");
    expect(lines).toContain("The cyclist reached the side junction at t=11 instead of t=8.");
    expect(lines).toContain("The car and Maya collided at t=12.");
    expect(lines.at(-1)).toMatch(/did not survive/);
  });
});
