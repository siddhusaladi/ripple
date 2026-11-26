import { Actor } from "./Actor";
import { World } from "./World";
import type {
  Intervention,
  OutcomeReason,
  PuzzleDefinition,
  SimEvent,
  SimulationResult,
  TickSnapshot,
} from "./types";

/** Raised when an intervention names an unknown object or an unsupported modification. */
export class InterventionError extends Error {
  override readonly name = "InterventionError";
}

/**
 * Owns the simulation clock and all mutable run state, and applies the tick rules in the
 * fixed order documented in handoff/PROJECT_SPEC.md §Order of operations.
 *
 * A Simulation is single-use: construct a new one (from the immutable PuzzleDefinition)
 * for every replay. That is what makes reset trivially correct.
 */
export class Simulation {
  private readonly world: World;
  private readonly actors: readonly Actor[];
  private readonly protagonist: Actor;
  private readonly events: SimEvent[] = [];
  private readonly snapshots: TickSnapshot[] = [];
  private tick = 0;
  private finished = false;
  private outcome: { success: boolean; reason: OutcomeReason } | null = null;

  constructor(
    private readonly puzzle: PuzzleDefinition,
    private readonly intervention: Intervention | null,
  ) {
    this.world = new World(puzzle);
    this.actors = puzzle.actors.map((def) => new Actor(def));
    const protagonist = this.actors.find((a) => a.id === puzzle.protagonist);
    if (!protagonist) throw new Error(`Protagonist "${puzzle.protagonist}" is not an actor`);
    this.protagonist = protagonist;
    this.setup();
  }

  get currentTick(): number {
    return this.tick;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  /** Runs every remaining tick and returns the full result. */
  run(): SimulationResult {
    while (!this.finished) this.step();
    return this.result();
  }

  result(): SimulationResult {
    if (!this.outcome) throw new Error("Simulation has not finished");
    return {
      puzzleId: this.puzzle.id,
      intervention: this.intervention,
      success: this.outcome.success,
      reason: this.outcome.reason,
      endTick: this.tick,
      events: [...this.events],
      snapshots: [...this.snapshots],
    };
  }

  // -------------------------------------------------------------------------
  // Setup (tick 0)
  // -------------------------------------------------------------------------

  private setup(): void {
    // 1. Apply the intervention.
    if (this.intervention) {
      const { objectId, modificationId } = this.intervention;
      const obj = this.world.object(objectId);
      if (!obj) throw new InterventionError(`Unknown object "${objectId}"`);
      if (!obj.supportsModification(modificationId)) {
        throw new InterventionError(`Object "${objectId}" does not support modification "${modificationId}"`);
      }
      obj.applyModification(modificationId);
      this.emit({ tick: 0, type: "object_modified", objectId, modificationId });
    }

    // 2. Blocked nodes, with and without the intervention (for route_changed).
    const blocked = this.world.blockedNodes();
    const baselineBlocked = new World(this.puzzle).blockedNodes();

    // 3. Plan routes.
    for (const actor of this.actors) {
      const { mode } = actor.traits;
      const route = this.world.graph.shortestPath(actor.node, actor.destination, mode, blocked);
      if (!route) {
        actor.markStuck();
        this.emit({ tick: 0, type: "no_route", actorId: actor.id });
        continue;
      }
      actor.setRoute(route);
      this.emit({ tick: 0, type: "route_planned", actorId: actor.id, nodes: route, segments: route.length - 1 });

      const baseline = this.world.graph.shortestPath(actor.node, actor.destination, mode, baselineBlocked);
      if (!baseline || !sameRoute(baseline, route)) {
        this.emit({
          tick: 0,
          type: "route_changed",
          actorId: actor.id,
          baselineSegments: baseline ? baseline.length - 1 : null,
          segments: route.length - 1,
        });
      }
    }

    this.checkCompletion();
    this.record();
  }

  // -------------------------------------------------------------------------
  // One tick
  // -------------------------------------------------------------------------

  step(): void {
    if (this.finished) return;
    this.tick += 1;
    const t = this.tick;

    // 1-2. Movement restrictions and next movement.
    const movers: Actor[] = [];
    for (const actor of this.actors) {
      if (!actor.isActive) continue;
      const next = actor.nextNode();
      if (next === null) continue;
      const light = actor.traits.obeysSignals ? this.world.signalOn(actor.node, next, actor.traits.mode) : null;
      if (light && !light.isGreen(t)) {
        actor.setWaiting(true);
        this.emit({ tick: t, type: "waited_at_signal", actorId: actor.id, signalId: light.id, nodeId: actor.node });
      } else {
        actor.setWaiting(false);
        movers.push(actor);
      }
    }

    // 3. Update positions simultaneously (intended nodes were fixed above).
    for (const actor of movers) actor.advance();

    // 5a. Landmark entries (emitted before collisions; see event order in the spec).
    for (const actor of movers) {
      const landmark = this.world.landmarkAt(actor.node);
      if (landmark) this.emit({ tick: t, type: "entered_landmark", actorId: actor.id, landmarkId: landmark.id });
    }

    // 4. Collisions.
    this.resolveCollisions(t, new Set(movers));

    // 5b. Arrivals.
    for (const actor of movers) {
      if (actor.isActive && actor.node === actor.destination) {
        actor.markArrived();
        this.emit({ tick: t, type: "arrived", actorId: actor.id });
      }
    }

    // 6-7. Completion and snapshot.
    this.checkCompletion();
    this.record();
  }

  private resolveCollisions(t: number, movers: ReadonlySet<Actor>): void {
    // Group on-map actors by node, preserving actor declaration order.
    const byNode = new Map<string, Actor[]>();
    for (const actor of this.actors) {
      if (!actor.isOnMap) continue;
      const group = byNode.get(actor.node);
      if (group) group.push(actor);
      else byNode.set(actor.node, [actor]);
    }

    const killed: Actor[] = [];
    for (const [nodeId, group] of byNode) {
      if (group.length < 2 || !group.some((a) => movers.has(a))) continue;
      this.emit({ tick: t, type: "collision", nodeId, actorIds: group.map((a) => a.id).sort() });
      if (!group.some((a) => !a.traits.vulnerable)) continue; // no vehicle involved: no effect
      for (const actor of group) {
        if (actor.status !== "active" && actor.status !== "stuck") continue;
        actor.markHit();
        if (actor.traits.vulnerable) killed.push(actor);
      }
    }
    for (const actor of killed) this.emit({ tick: t, type: "died", actorId: actor.id });
  }

  private checkCompletion(): void {
    const anyActive = this.actors.some((a) => a.isActive);
    if (anyActive && this.tick < this.puzzle.maxTicks) return;
    this.finished = true;
    this.outcome = this.decideOutcome();
    this.emit({ tick: this.tick, type: "completed", ...this.outcome });
  }

  /** Success depends only on the protagonist's final status. */
  private decideOutcome(): { success: boolean; reason: OutcomeReason } {
    switch (this.protagonist.status) {
      case "arrived":
        return { success: true, reason: "arrived" };
      case "dead":
      case "crashed":
        return { success: false, reason: "killed" };
      case "stuck":
        return { success: false, reason: "no_route" };
      case "active":
        return { success: false, reason: "timeout" };
    }
  }

  private record(): void {
    this.snapshots.push({
      tick: this.tick,
      actors: this.actors.map((a) => a.snapshot()),
      signals: this.world.signalSnapshot(this.tick),
    });
  }

  private emit(event: SimEvent): void {
    this.events.push(event);
  }
}

function sameRoute(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((node, i) => node === b[i]);
}
