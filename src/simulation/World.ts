import { NavGraph } from "./NavGraph";
import { MovableObstacle, TrafficLight, createEditableObject } from "./objects";
import type { LandmarkDef, Mode, PuzzleDefinition, SignalSnapshot } from "./types";

/**
 * The environment for one run: the navigation graph, the editable objects in their
 * current state, and landmark lookup. Built fresh from a PuzzleDefinition each run.
 */
export class World {
  readonly graph: NavGraph;
  readonly objects: ReadonlyArray<TrafficLight | MovableObstacle>;
  private readonly landmarkByNode: ReadonlyMap<string, LandmarkDef>;

  constructor(puzzle: PuzzleDefinition) {
    this.graph = new NavGraph(puzzle.nodes, puzzle.edges);
    this.objects = puzzle.objects.map(createEditableObject);
    this.landmarkByNode = new Map(puzzle.landmarks.map((l) => [l.node, l]));
  }

  object(id: string): TrafficLight | MovableObstacle | null {
    return this.objects.find((o) => o.id === id) ?? null;
  }

  /** Nodes occupied by obstacles in their current positions. */
  blockedNodes(): Set<string> {
    const blocked = new Set<string>();
    for (const obj of this.objects) {
      if (!(obj instanceof MovableObstacle)) continue;
      const node = this.graph.nodeAtTile(obj.tile);
      if (node !== null) blocked.add(node);
    }
    return blocked;
  }

  /** The light controlling movement from `from` to `to` in `mode`, if any. */
  signalOn(from: string, to: string, mode: Mode): TrafficLight | null {
    const signalId = this.graph.edge(from, to, mode)?.signal ?? null;
    if (signalId === null) return null;
    const light = this.object(signalId);
    return light instanceof TrafficLight ? light : null;
  }

  landmarkAt(node: string): LandmarkDef | null {
    return this.landmarkByNode.get(node) ?? null;
  }

  signalSnapshot(tick: number): SignalSnapshot[] {
    return this.objects
      .filter((o): o is TrafficLight => o instanceof TrafficLight)
      .map((light) => ({ id: light.id, green: light.isGreen(tick) }));
  }
}
