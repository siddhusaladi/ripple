// Test 5: the same puzzle + intervention always yields identical results.
import { describe, expect, it } from "vitest";
import { runSimulation, type Intervention } from "../../src/simulation";
import { PUZZLE_001 } from "../../src/puzzles";

const SCENARIOS: Array<Intervention | null> = [
  null,
  { objectId: "traffic_light", modificationId: "retime" },
  { objectId: "trash_can", modificationId: "move_to_sidewalk" },
  { objectId: "delivery_crate", modificationId: "move_to_bike_path" },
];

describe("determinism", () => {
  for (const intervention of SCENARIOS) {
    it(`repeats exactly: ${intervention?.objectId ?? "no intervention"}`, () => {
      const first = runSimulation(PUZZLE_001, intervention);
      for (let i = 0; i < 25; i++) {
        const again = runSimulation(PUZZLE_001, intervention);
        // Ordered event log (with ticks), every per-tick snapshot, outcome, and end tick.
        expect(again).toEqual(first);
      }
      expect(first.snapshots).toHaveLength(first.endTick + 1);
    });
  }

  it("produces different timelines for different interventions", () => {
    const logs = SCENARIOS.map((i) => JSON.stringify(runSimulation(PUZZLE_001, i).events));
    expect(new Set(logs).size).toBe(SCENARIOS.length);
  });
});
