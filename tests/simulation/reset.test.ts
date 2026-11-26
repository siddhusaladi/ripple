// Test 6: running with one edit leaves no trace in later runs (reset = fresh run from immutable data).
import { describe, expect, it } from "vitest";
import { Simulation, runSimulation } from "../../src/simulation";
import { PUZZLE_001 } from "../../src/puzzles";
import puzzleJson from "../../src/puzzles/puzzle-001.json";

describe("reset", () => {
  it("restores the unmodified puzzle after an edit", () => {
    const fresh = runSimulation(PUZZLE_001, null);
    runSimulation(PUZZLE_001, { objectId: "trash_can", modificationId: "move_to_sidewalk" });
    expect(runSimulation(PUZZLE_001, null)).toEqual(fresh);
  });

  it("lets a different edit run without leftovers from the previous one", () => {
    const lightOnly = runSimulation(PUZZLE_001, { objectId: "traffic_light", modificationId: "retime" });
    runSimulation(PUZZLE_001, { objectId: "trash_can", modificationId: "move_to_sidewalk" });
    const after = runSimulation(PUZZLE_001, { objectId: "traffic_light", modificationId: "retime" });
    expect(after).toEqual(lightOnly);
    // The trash-can detour must not persist: pedestrian keeps the original 16-segment route.
    const route = after.events.find((e) => e.type === "route_planned" && e.actorId === "pedestrian");
    expect(route).toMatchObject({ segments: 16 });
  });

  it("starts every run from the puzzle's initial positions", () => {
    const sim = new Simulation(PUZZLE_001, { objectId: "delivery_crate", modificationId: "move_to_bike_path" });
    sim.run();
    const start = runSimulation(PUZZLE_001, null).snapshots[0]!;
    expect(start.tick).toBe(0);
    expect(start.actors.map((a) => [a.id, a.node, a.status])).toEqual(
      PUZZLE_001.actors.map((a) => [a.id, a.start, "active"]),
    );
  });

  it("never mutates the puzzle definition (it is deeply frozen)", () => {
    for (const obj of PUZZLE_001.objects) runSimulation(PUZZLE_001, { objectId: obj.id, modificationId: obj.modifications[0]!.id });
    expect(PUZZLE_001).toEqual(puzzleJson);
    expect(Object.isFrozen(PUZZLE_001.objects[1])).toBe(true);
  });
});
