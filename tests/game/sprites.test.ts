// The decorative map must agree with the navigation graph, so what the player sees is
// where actors can actually go.
import { describe, expect, it } from "vitest";
import { GROUND_FRAMES, OBJECT_FRAMES, WALKABLE_TILES } from "../../src/game/sprites";
import { KIND_TRAITS } from "../../src/simulation";
import { PUZZLE_001 } from "../../src/puzzles";

const charAt = (x: number, y: number): string => PUZZLE_001.map[y]![x]!;

describe("Puzzle 001 art", () => {
  it("has a frame for every map character", () => {
    const chars = new Set(PUZZLE_001.map.join(""));
    for (const ch of chars) expect(GROUND_FRAMES, `map char "${ch}"`).toHaveProperty(ch);
  });

  it("places every node on a tile its travel modes can use", () => {
    for (const chain of PUZZLE_001.edges) {
      for (const id of chain.chain) {
        const node = PUZZLE_001.nodes.find((n) => n.id === id)!;
        for (const mode of chain.modes) {
          expect(WALKABLE_TILES[mode], `${id} (${mode}) on "${charAt(node.x, node.y)}"`).toContain(charAt(node.x, node.y));
        }
      }
    }
  });

  it("has a frame for every object and starts actors on matching tiles", () => {
    for (const obj of PUZZLE_001.objects) {
      expect(OBJECT_FRAMES).toHaveProperty(obj.kind === "obstacle" ? obj.appearance : obj.kind);
    }
    for (const actor of PUZZLE_001.actors) {
      const node = PUZZLE_001.nodes.find((n) => n.id === actor.start)!;
      expect(WALKABLE_TILES[KIND_TRAITS[actor.kind].mode]).toContain(charAt(node.x, node.y));
    }
  });
});
