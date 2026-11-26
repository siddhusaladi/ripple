// TimelineController: playback of precomputed results. Also the integration check that what
// the browser draws (actorPose) is exactly the headless simulation's state at every tick.
import { describe, expect, it } from "vitest";
import { TimelineController } from "../../src/game/TimelineController";
import { InterventionError, runSimulation, type Intervention } from "../../src/simulation";
import { PUZZLE_001 } from "../../src/puzzles";

const TRASH: Intervention = { objectId: "trash_can", modificationId: "move_to_sidewalk" };
const LIGHT: Intervention = { objectId: "traffic_light", modificationId: "retime" };
const ALL: Array<Intervention | null> = [
  null,
  LIGHT,
  TRASH,
  { objectId: "delivery_crate", modificationId: "move_to_bike_path" },
];

function playToEnd(tl: TimelineController, stepMs = 16): void {
  tl.play();
  for (let i = 0; i < 100_000 && tl.phase === "playing"; i++) tl.update(stepMs);
}

describe("TimelineController", () => {
  it("starts ready at tick 0 with the original morning", () => {
    const tl = new TimelineController(PUZZLE_001);
    expect(tl.phase).toBe("ready");
    expect(tl.playhead).toBe(0);
    expect(tl.selected).toBeNull();
    expect(tl.result).toEqual(runSimulation(PUZZLE_001, null));
  });

  it("advances by elapsed time, clamps at endTick, and finishes", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.play();
    tl.update(1000); // 2 ticks per second by default
    expect(tl.playhead).toBe(2);
    tl.update(60_000);
    expect(tl.playhead).toBe(12);
    expect(tl.phase).toBe("finished");
  });

  it("pauses and resumes without moving the playhead", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.play();
    tl.update(1500);
    tl.pause();
    tl.update(5000);
    expect(tl.playhead).toBe(3);
    tl.play();
    tl.update(500);
    expect(tl.playhead).toBe(4);
  });

  it("interpolates halfway between two ticks", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.play();
    tl.update(250); // 0.5 tick: pedestrian halfway from s4_7 to s5_7
    expect(tl.actorPose("pedestrian")).toMatchObject({ x: 4.5, y: 7, dx: 1, dy: 0, status: "active" });
  });

  it("does not move an actor waiting at a red light", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.select(LIGHT);
    tl.play();
    tl.update(12.5 * 500); // playhead 12.5
    expect(tl.actorPose("car")).toMatchObject({ x: 13, y: 9, waiting: true, dx: 0 });
  });

  it("select runs the real simulation; selecting again clears the edit", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.select(TRASH);
    expect(tl.result).toEqual(runSimulation(PUZZLE_001, TRASH));
    expect(tl.objectTile("trash_can")).toEqual({ x: 10, y: 7 });
    tl.select(TRASH);
    expect(tl.selected).toBeNull();
    expect(tl.objectTile("trash_can")).toEqual({ x: 10, y: 6 });
  });

  it("only allows edits at tick 0 or after a run finishes", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.play();
    tl.update(1000);
    expect(() => tl.select(TRASH)).toThrow(/Rewind/);
    tl.update(60_000);
    tl.select(TRASH); // finished: allowed, rewinds
    expect(tl.phase).toBe("ready");
    expect(tl.playhead).toBe(0);
  });

  it("rejects invalid interventions without changing state", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.select(LIGHT);
    expect(() => tl.select({ objectId: "trash_can", modificationId: "retime" })).toThrow(InterventionError);
    expect(tl.selected).toEqual(LIGHT);
  });

  it("reset clears the edit; replay after reset matches a fresh original run", () => {
    const tl = new TimelineController(PUZZLE_001);
    tl.select(TRASH);
    playToEnd(tl);
    tl.reset();
    expect(tl.selected).toBeNull();
    expect(tl.phase).toBe("ready");
    expect(tl.objectTile("trash_can")).toEqual({ x: 10, y: 6 });
    playToEnd(tl);
    expect(tl.result).toEqual(runSimulation(PUZZLE_001, null));
    expect(tl.runsStarted).toBe(2);
  });

  it("playback speed and frame timing never change the outcome", () => {
    for (const i of ALL) {
      const outcomes = [5, 16, 33, 250].map((ms) => {
        const tl = new TimelineController(PUZZLE_001);
        tl.ticksPerSecond = ms === 250 ? 10 : 2;
        tl.select(i);
        playToEnd(tl, ms);
        return JSON.stringify(tl.result);
      });
      expect(new Set(outcomes).size).toBe(1);
    }
  });
});

describe("browser display matches the headless simulation", () => {
  for (const i of ALL) {
    it(`draws headless positions at every tick: ${i?.objectId ?? "no intervention"}`, () => {
      const headless = runSimulation(PUZZLE_001, i);
      const tl = new TimelineController(PUZZLE_001);
      tl.select(i);
      tl.play();
      for (const snap of headless.snapshots) {
        for (const actor of snap.actors) {
          const node = PUZZLE_001.nodes.find((n) => n.id === actor.node)!;
          expect(tl.actorPose(actor.id)).toMatchObject({ x: node.x, y: node.y, status: actor.status, waiting: actor.waiting });
        }
        expect(tl.snapshot().signals).toEqual(snap.signals);
        tl.update(1000 / tl.ticksPerSecond); // exactly one tick
      }
      expect(tl.phase).toBe("finished");
      expect(tl.result.success).toBe(headless.success);
    });
  }
});
