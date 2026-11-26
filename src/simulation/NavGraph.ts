import type { EdgeChainDef, Mode, NodeDef, Tile } from "./types";

/** A directed traversal from one node to a neighbor. Two-way edges produce two of these. */
export interface DirectedEdge {
  readonly from: string;
  readonly to: string;
  readonly modes: ReadonlySet<Mode>;
  readonly signal: string | null;
}

/**
 * Navigation graph: nodes with tile positions and mode-restricted edges.
 * Immutable after construction; obstacles are passed to queries rather than stored.
 */
export class NavGraph {
  private readonly nodesById = new Map<string, NodeDef>();
  private readonly nodeIdByTile = new Map<string, string>();
  /** Outgoing edges per node, in declaration order (this order is the BFS tie-break). */
  private readonly outgoing = new Map<string, DirectedEdge[]>();

  constructor(nodes: readonly NodeDef[], chains: readonly EdgeChainDef[]) {
    for (const node of nodes) {
      this.nodesById.set(node.id, node);
      this.nodeIdByTile.set(tileKey(node), node.id);
      this.outgoing.set(node.id, []);
    }
    for (const chain of chains) {
      const modes = new Set(chain.modes);
      const signal = chain.signal ?? null;
      for (let i = 0; i + 1 < chain.chain.length; i++) {
        const a = chain.chain[i]!;
        const b = chain.chain[i + 1]!;
        this.addEdge({ from: a, to: b, modes, signal });
        if (!chain.oneWay) this.addEdge({ from: b, to: a, modes, signal });
      }
    }
  }

  hasNode(id: string): boolean {
    return this.nodesById.has(id);
  }

  node(id: string): NodeDef {
    const node = this.nodesById.get(id);
    if (!node) throw new Error(`Unknown node "${id}"`);
    return node;
  }

  /** Id of the node on `tile`, or null if the tile has no node. */
  nodeAtTile(tile: Tile): string | null {
    return this.nodeIdByTile.get(tileKey(tile)) ?? null;
  }

  edge(from: string, to: string, mode: Mode): DirectedEdge | null {
    return this.outgoing.get(from)?.find((e) => e.to === to && e.modes.has(mode)) ?? null;
  }

  /**
   * Breadth-first shortest path (fewest segments) from `start` to `goal` for `mode`,
   * never entering a node in `blocked`. Returns the node sequence including both ends,
   * or null if unreachable. Deterministic: neighbors are explored in edge declaration order,
   * and the first path found to a node is kept.
   */
  shortestPath(start: string, goal: string, mode: Mode, blocked: ReadonlySet<string>): string[] | null {
    if (blocked.has(start) || blocked.has(goal)) return null;
    const previous = new Map<string, string | null>([[start, null]]);
    const queue: string[] = [start];
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head]!;
      if (current === goal) return this.unwind(previous, goal);
      for (const edge of this.outgoing.get(current) ?? []) {
        if (!edge.modes.has(mode) || blocked.has(edge.to) || previous.has(edge.to)) continue;
        previous.set(edge.to, current);
        queue.push(edge.to);
      }
    }
    return null;
  }

  private unwind(previous: ReadonlyMap<string, string | null>, goal: string): string[] {
    const path: string[] = [];
    for (let at: string | null = goal; at !== null; at = previous.get(at) ?? null) path.push(at);
    return path.reverse();
  }

  private addEdge(edge: DirectedEdge): void {
    const list = this.outgoing.get(edge.from);
    if (!list) throw new Error(`Edge references unknown node "${edge.from}"`);
    if (!this.nodesById.has(edge.to)) throw new Error(`Edge references unknown node "${edge.to}"`);
    list.push(edge);
  }
}

function tileKey(tile: Tile): string {
  return `${tile.x},${tile.y}`;
}
