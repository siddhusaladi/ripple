// Scenario tests for Puzzle 001 "The Intersection".
// Every expected value below is derived by hand in docs/puzzle-spec.md from the
// graph distances, the signal cycle, and the tick rules in handoff/PROJECT_SPEC.md.
// Do not change an expectation to match the implementation; fix the spec first.
import { describe, expect, it } from "vitest";
import { runSimulation } from "../../src/simulation";
import { PUZZLE_001 } from "../../src/puzzles";
import { eventsOf, landmarkTicks, memo, nodeAt, plannedRoute } from "./helpers";

const ORIGINAL_PED_ROUTE = [
  "s4_7", "s5_7", "s6_7", "s7_7", "s8_7", "s9_7", "s10_7", "s11_7", "s12_7", "s13_7", "s14_7",
  "x14_8", "x14_9", "s14_10", "s15_10", "s16_10", "s17_10",
];
const DETOUR_PED_ROUTE = [
  "s4_7", "s5_7", "s6_7", "s7_7", "s8_7", "s8_6", "s8_5", "s9_5", "s10_5", "s11_5", "s11_6", "s11_7",
  "s12_7", "s13_7", "s14_7", "x14_8", "x14_9", "s14_10", "s15_10", "s16_10", "s17_10",
];
const DETOUR_BIKE_ROUTE = [
  "b22_2", "b21_2", "b20_2", "b20_3", "b20_4", "b19_4", "b18_4", "b17_4", "b16_3", "b16_2", "b15_2",
  "j14_2", "b14_1", "b14_0",
];

describe("Scenario 0: no intervention", () => {
  const r = memo(() => runSimulation(PUZZLE_001, null));

  it("plans the default routes", () => {
    expect(plannedRoute(r(), "pedestrian").nodes).toEqual(ORIGINAL_PED_ROUTE);
    expect(plannedRoute(r(), "pedestrian").segments).toBe(16);
    expect(plannedRoute(r(), "car").segments).toBe(21);
    expect(plannedRoute(r(), "cyclist").segments).toBe(10);
    expect(eventsOf(r(), "route_changed")).toEqual([]);
  });

  it("pedestrian and car both enter the crossing at tick 12 and collide", () => {
    expect(landmarkTicks(r(), "pedestrian", "crossing")).toEqual([12]);
    expect(landmarkTicks(r(), "car", "crossing")).toEqual([12]);
    expect(eventsOf(r(), "collision")).toEqual([
      { tick: 12, type: "collision", nodeId: "x14_9", actorIds: ["car", "pedestrian"] },
    ]);
    expect(eventsOf(r(), "died")).toEqual([{ tick: 12, type: "died", actorId: "pedestrian" }]);
  });

  it("cyclist passes the side junction at tick 8, unaffected", () => {
    expect(landmarkTicks(r(), "cyclist", "side_junction")).toEqual([8]);
  });

  it("fails at tick 12", () => {
    expect(r().success).toBe(false);
    expect(r().reason).toBe("killed");
    expect(r().endTick).toBe(12);
  });
});

describe("Scenario 1: traffic light retimed", () => {
  const r = memo(() => runSimulation(PUZZLE_001, { objectId: "traffic_light", modificationId: "retime" }));

  it("records the edit at tick 0", () => {
    expect(r().events[0]).toEqual({ tick: 0, type: "object_modified", objectId: "traffic_light", modificationId: "retime" });
  });

  it("car is held at the stop line during ticks 12, 13, 14", () => {
    const waits = eventsOf(r(), "waited_at_signal").filter((e) => e.actorId === "car");
    expect(waits.map((e) => e.tick)).toEqual([12, 13, 14]);
    expect(waits.every((e) => e.nodeId === "r13_9" && e.signalId === "traffic_light")).toBe(true);
    for (const t of [11, 12, 13, 14]) expect(nodeAt(r(), "car", t)).toBe("r13_9");
  });

  it("pedestrian crosses at tick 12 and has left before the car enters at tick 15", () => {
    expect(landmarkTicks(r(), "pedestrian", "crossing")).toEqual([12]);
    expect(nodeAt(r(), "pedestrian", 13)).toBe("s14_10");
    expect(landmarkTicks(r(), "car", "crossing")).toEqual([15]);
    expect(eventsOf(r(), "collision")).toEqual([]);
  });

  it("pedestrian survives and reaches the cafe at tick 16", () => {
    expect(eventsOf(r(), "arrived").find((e) => e.actorId === "pedestrian")?.tick).toBe(16);
    expect(eventsOf(r(), "died")).toEqual([]);
    expect(r().success).toBe(true);
    expect(r().reason).toBe("arrived");
    expect(r().endTick).toBe(24); // car, delayed 3 ticks, leaves the map last
  });
});

describe("Scenario 2: trash can pushed onto the sidewalk", () => {
  const r = memo(() => runSimulation(PUZZLE_001, { objectId: "trash_can", modificationId: "move_to_sidewalk" }));

  it("blocks the normal sidewalk and forces a route 4 segments longer", () => {
    const route = plannedRoute(r(), "pedestrian");
    expect(route.nodes).not.toContain("s10_7");
    expect(route.nodes).toEqual(DETOUR_PED_ROUTE);
    expect(route.segments).toBe(20);
    expect(eventsOf(r(), "route_changed")).toEqual([
      { tick: 0, type: "route_changed", actorId: "pedestrian", baselineSegments: 16, segments: 20 },
    ]);
  });

  it("car still enters the crossing at tick 12; pedestrian reaches it at tick 16", () => {
    expect(landmarkTicks(r(), "car", "crossing")).toEqual([12]);
    expect(landmarkTicks(r(), "pedestrian", "crossing")).toEqual([16]);
    expect(eventsOf(r(), "collision")).toEqual([]);
  });

  it("pedestrian survives", () => {
    expect(eventsOf(r(), "arrived").find((e) => e.actorId === "pedestrian")?.tick).toBe(20);
    expect(r().success).toBe(true);
    expect(r().endTick).toBe(21);
  });
});

describe("Scenario 3: delivery crate dragged into the bike path", () => {
  const r = memo(() => runSimulation(PUZZLE_001, { objectId: "delivery_crate", modificationId: "move_to_bike_path" }));

  it("reroutes only the cyclist, 3 segments longer", () => {
    expect(plannedRoute(r(), "cyclist").nodes).toEqual(DETOUR_BIKE_ROUTE);
    expect(eventsOf(r(), "route_changed")).toEqual([
      { tick: 0, type: "route_changed", actorId: "cyclist", baselineSegments: 10, segments: 13 },
    ]);
    expect(plannedRoute(r(), "pedestrian").nodes).toEqual(ORIGINAL_PED_ROUTE);
  });

  it("cyclist reaches the side junction at tick 11 instead of 8", () => {
    expect(landmarkTicks(r(), "cyclist", "side_junction")).toEqual([11]);
  });

  it("pedestrian and car still collide at tick 12", () => {
    expect(eventsOf(r(), "collision")).toEqual([
      { tick: 12, type: "collision", nodeId: "x14_9", actorIds: ["car", "pedestrian"] },
    ]);
    expect(eventsOf(r(), "died")).toEqual([{ tick: 12, type: "died", actorId: "pedestrian" }]);
    expect(r().success).toBe(false);
    expect(r().endTick).toBe(13); // cyclist arrives after the crash
  });
});
