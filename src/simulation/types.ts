// Shared data types for RIPPLE's headless simulation.
// Nothing in src/simulation/ may import Phaser or use browser APIs.

/** Travel mode an edge permits. Each actor kind travels in exactly one mode. */
export type Mode = "foot" | "car" | "bike";

export type ActorKind = "pedestrian" | "car" | "cyclist";

export interface Tile {
  readonly x: number;
  readonly y: number;
}

// ---------------------------------------------------------------------------
// Puzzle definition (immutable input data, loaded from JSON)
// ---------------------------------------------------------------------------

export interface NodeDef {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/**
 * A chain of consecutive edges: chain [a, b, c] declares edges a-b and b-c.
 * Two-way unless oneWay is true (then only a->b, b->c).
 */
export interface EdgeChainDef {
  readonly chain: readonly string[];
  readonly modes: readonly Mode[];
  readonly oneWay?: boolean;
  /** Id of a traffic light that controls entry along these edges. */
  readonly signal?: string;
}

export interface LandmarkDef {
  readonly id: string;
  readonly node: string;
  readonly label: string;
}

export interface ActorDef {
  readonly id: string;
  readonly kind: ActorKind;
  readonly label: string;
  readonly start: string;
  readonly destination: string;
}

/** Green at tick t iff ((t + offset) mod period) < greenTicks. */
export interface SignalCycle {
  readonly period: number;
  readonly greenTicks: number;
  readonly offset: number;
}

export interface TrafficLightModificationDef {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly cycle: SignalCycle;
}

export interface TrafficLightDef {
  readonly id: string;
  readonly kind: "traffic_light";
  readonly label: string;
  readonly tile: Tile;
  readonly cycle: SignalCycle;
  readonly modifications: readonly TrafficLightModificationDef[];
}

export interface ObstacleModificationDef {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Tile the obstacle is moved to. Blocks the graph node on that tile, if any. */
  readonly tile: Tile;
}

export interface ObstacleDef {
  readonly id: string;
  readonly kind: "obstacle";
  /** Rendering hint only; never read by simulation rules. */
  readonly appearance: string;
  readonly label: string;
  readonly tile: Tile;
  readonly modifications: readonly ObstacleModificationDef[];
}

export type EditableObjectDef = TrafficLightDef | ObstacleDef;

export interface PuzzleDefinition {
  readonly id: string;
  readonly title: string;
  readonly intro: string;
  readonly maxTicks: number;
  /** Decorative tile map (rendering only). One string per row. */
  readonly map: readonly string[];
  readonly nodes: readonly NodeDef[];
  readonly edges: readonly EdgeChainDef[];
  readonly landmarks: readonly LandmarkDef[];
  readonly actors: readonly ActorDef[];
  /** Actor whose survival decides the puzzle. */
  readonly protagonist: string;
  readonly objects: readonly EditableObjectDef[];
}

/** The player's single edit for one replay. */
export interface Intervention {
  readonly objectId: string;
  readonly modificationId: string;
}

// ---------------------------------------------------------------------------
// Simulation output
// ---------------------------------------------------------------------------

/**
 * active   - still travelling (may be waiting at a signal)
 * arrived  - reached destination and left the map
 * dead     - vulnerable actor killed in a collision
 * crashed  - vehicle stopped by a collision
 * stuck    - no route exists to the destination
 */
export type ActorStatus = "active" | "arrived" | "dead" | "crashed" | "stuck";

export type SimEvent =
  | { readonly tick: number; readonly type: "object_modified"; readonly objectId: string; readonly modificationId: string }
  | { readonly tick: number; readonly type: "route_planned"; readonly actorId: string; readonly nodes: readonly string[]; readonly segments: number }
  | {
      readonly tick: number;
      readonly type: "route_changed";
      readonly actorId: string;
      /** Route length without the intervention; null if the destination was unreachable. */
      readonly baselineSegments: number | null;
      readonly segments: number;
    }
  | { readonly tick: number; readonly type: "no_route"; readonly actorId: string }
  | { readonly tick: number; readonly type: "waited_at_signal"; readonly actorId: string; readonly signalId: string; readonly nodeId: string }
  | { readonly tick: number; readonly type: "entered_landmark"; readonly actorId: string; readonly landmarkId: string }
  | { readonly tick: number; readonly type: "collision"; readonly nodeId: string; readonly actorIds: readonly string[] }
  | { readonly tick: number; readonly type: "died"; readonly actorId: string }
  | { readonly tick: number; readonly type: "arrived"; readonly actorId: string }
  | { readonly tick: number; readonly type: "completed"; readonly success: boolean; readonly reason: OutcomeReason };

export type SimEventType = SimEvent["type"];

export type OutcomeReason = "arrived" | "killed" | "no_route" | "timeout";

export interface ActorSnapshot {
  readonly id: string;
  readonly node: string;
  readonly status: ActorStatus;
  readonly waiting: boolean;
}

export interface SignalSnapshot {
  readonly id: string;
  readonly green: boolean;
}

/** Complete observable state after a tick has been processed. */
export interface TickSnapshot {
  readonly tick: number;
  readonly actors: readonly ActorSnapshot[];
  readonly signals: readonly SignalSnapshot[];
}

export interface SimulationResult {
  readonly puzzleId: string;
  readonly intervention: Intervention | null;
  readonly success: boolean;
  readonly reason: OutcomeReason;
  readonly endTick: number;
  readonly events: readonly SimEvent[];
  /** snapshots[t] is the state after tick t (snapshots[0] is the start). */
  readonly snapshots: readonly TickSnapshot[];
}
