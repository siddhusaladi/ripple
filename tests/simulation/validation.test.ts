// Test 7: malformed puzzles, unknown objects, and unsupported modifications fail predictably.
import { describe, expect, it } from "vitest";
import { InterventionError, runSimulation } from "../../src/simulation";
import { PUZZLE_001, PuzzleValidationError, loadPuzzle } from "../../src/puzzles";
import malformed from "../fixtures/malformed-puzzle.json";
import puzzleJson from "../../src/puzzles/puzzle-001.json";

function issuesOf(raw: unknown): readonly string[] {
  try {
    loadPuzzle(raw);
  } catch (err) {
    if (err instanceof PuzzleValidationError) return err.issues;
    throw err;
  }
  throw new Error("expected PuzzleValidationError");
}

describe("puzzle validation", () => {
  it("accepts Puzzle 001", () => {
    expect(() => loadPuzzle(structuredClone(puzzleJson))).not.toThrow();
  });

  it("rejects non-objects", () => {
    expect(issuesOf(null)).toEqual(["puzzle must be an object"]);
    expect(issuesOf([1, 2])).toEqual(["puzzle must be an object"]);
  });

  it("reports every problem in a malformed puzzle", () => {
    const issues = issuesOf(malformed);
    const expected = [
      `"maxTicks" must be a positive integer`,
      `"map" rows must all have the same length`,
      `duplicate node id "a"`,
      `node "c" shares tile (1,0) with another node`,
      `objects[0] must offer at least one modification`,
      `objects[0].cycle must have integer period > 0, 0 <= greenTicks <= period, integer offset`,
      `edges[0].chain[1] references unknown node "ghost"`,
      `edges[0].modes must be a non-empty subset of foot, car, bike`,
      `edges[1].signal must name a traffic_light object`,
      `landmark "lm" references unknown node "nowhere"`,
      `actor "p" starts at its destination`,
      `actor "q" has unknown kind "dragon"`,
      `actor "q" shares its start node with another actor`,
      `protagonist "nobody" is not an actor`,
    ];
    expect(issues).toEqual(expected);
  });

  it("rejects a puzzle whose edge references a missing node", () => {
    const raw = structuredClone(puzzleJson) as { edges: Array<{ chain: string[] }> };
    raw.edges[0]!.chain.push("s99_99");
    expect(issuesOf(raw)).toEqual([`edges[0].chain[17] references unknown node "s99_99"`]);
  });
});

describe("intervention validation", () => {
  it("rejects an unknown object id", () => {
    expect(() => runSimulation(PUZZLE_001, { objectId: "fire_hydrant", modificationId: "move" })).toThrow(
      new InterventionError(`Unknown object "fire_hydrant"`),
    );
  });

  it("rejects a modification the object does not support", () => {
    expect(() => runSimulation(PUZZLE_001, { objectId: "trash_can", modificationId: "retime" })).toThrow(InterventionError);
    expect(() => runSimulation(PUZZLE_001, { objectId: "traffic_light", modificationId: "move_to_sidewalk" })).toThrow(
      /does not support modification "move_to_sidewalk"/,
    );
  });
});
