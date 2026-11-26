// Playback of precomputed simulation results for the UI. Pure TypeScript: no Phaser, no DOM.
//
// The controller never decides outcomes. Whenever the player's selection changes, it asks the
// headless simulation for the complete result, then only moves a playhead through that
// result's snapshots. Wall-clock time (dtMs) affects *how fast* the playhead moves, never
// what happens. See DECISIONS.md D5.
import { InterventionError, runSimulation } from "../simulation";
import type {
  ActorStatus,
  Intervention,
  PuzzleDefinition,
  SimEvent,
  SimulationResult,
  Tile,
  TickSnapshot,
} from "../simulation/types";

/**
 * ready    - at tick 0, the player may choose an edit
 * playing  - playhead advancing
 * paused   - playhead stopped mid-run
 * finished - playhead at endTick; outcome revealed
 */
export type Phase = "ready" | "playing" | "paused" | "finished";

export interface ActorPose {
  readonly id: string;
  /** Tile coordinates, fractional while moving between nodes. */
  readonly x: number;
  readonly y: number;
  readonly status: ActorStatus;
  readonly waiting: boolean;
  /** Unit direction of travel for the current segment (0,0 when stationary). */
  readonly dx: number;
  readonly dy: number;
}

export const DEFAULT_TICKS_PER_SECOND = 2;

export class TimelineController {
  readonly baseline: SimulationResult;
  private selection: Intervention | null = null;
  private current: SimulationResult;
  private head = 0;
  private state: Phase = "ready";
  private attempts = 0;
  ticksPerSecond = DEFAULT_TICKS_PER_SECOND;

  constructor(readonly puzzle: PuzzleDefinition) {
    this.baseline = runSimulation(puzzle, null);
    this.current = this.baseline;
  }

  // --- State --------------------------------------------------------------

  get phase(): Phase {
    return this.state;
  }

  get selected(): Intervention | null {
    return this.selection;
  }

  /** The full result for the current selection. Hidden from the player until finished. */
  get result(): SimulationResult {
    return this.current;
  }

  /** Playhead position in ticks (fractional during playback). */
  get playhead(): number {
    return this.head;
  }

  /** The last fully reached tick. */
  get tick(): number {
    return Math.floor(this.head);
  }

  /** Number of runs the player has started (watching the original accident counts). */
  get runsStarted(): number {
    return this.attempts;
  }

  get canEdit(): boolean {
    return this.state === "ready" || this.state === "finished";
  }

  // --- Commands -----------------------------------------------------------

  /**
   * Chooses the single edit for the next replay (null clears it). Choosing the already
   * selected edit clears it. Allowed only at tick 0 or after a run has finished, which rewinds.
   */
  select(intervention: Intervention | null): void {
    if (!this.canEdit) throw new Error("Rewind before changing the neighborhood");
    const same =
      intervention !== null &&
      this.selection !== null &&
      intervention.objectId === this.selection.objectId &&
      intervention.modificationId === this.selection.modificationId;
    const next = same ? null : intervention;
    // runSimulation validates the intervention (throws InterventionError) before we commit to it.
    const result = next ? runSimulation(this.puzzle, next) : this.baseline;
    this.selection = next;
    this.current = result;
    this.rewind();
  }

  play(): void {
    if (this.state === "ready" || this.state === "finished") {
      this.head = 0;
      this.attempts += 1;
    }
    this.state = "playing";
  }

  pause(): void {
    if (this.state === "playing") this.state = "paused";
  }

  /** Back to tick 0, keeping the current selection. */
  rewind(): void {
    this.head = 0;
    this.state = "ready";
  }

  /** Back to tick 0 with no edit: the original morning. */
  reset(): void {
    this.selection = null;
    this.current = this.baseline;
    this.rewind();
  }

  /** Advances the playhead by real elapsed time. Purely visual pacing. */
  update(dtMs: number): void {
    if (this.state !== "playing" || dtMs <= 0) return;
    this.head = Math.min(this.head + (dtMs / 1000) * this.ticksPerSecond, this.current.endTick);
    if (this.head >= this.current.endTick) this.state = "finished";
  }

  // --- Views for rendering --------------------------------------------------

  snapshot(tick: number = this.tick): TickSnapshot {
    const snaps = this.current.snapshots;
    return snaps[Math.max(0, Math.min(tick, snaps.length - 1))]!;
  }

  /** Events that have happened by the current playhead (tick 0 setup events included). */
  visibleEvents(): SimEvent[] {
    return this.current.events.filter((e) => e.tick <= this.tick);
  }

  actorPose(actorId: string): ActorPose {
    const t = this.tick;
    const from = this.findActor(this.snapshot(t), actorId);
    const to = this.findActor(this.snapshot(t + 1), actorId);
    const a = this.nodeTile(from.node);
    const b = this.nodeTile(to.node);
    // Only interpolate while the actor is still active at the start of the segment.
    const frac = from.status === "active" && t < this.current.endTick ? this.head - t : 0;
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    return {
      id: actorId,
      x: a.x + (b.x - a.x) * frac,
      y: a.y + (b.y - a.y) * frac,
      status: from.status,
      waiting: from.waiting,
      dx: frac > 0 ? dx : 0,
      dy: frac > 0 ? dy : 0,
    };
  }

  /** Where an editable object should be drawn under the current selection. */
  objectTile(objectId: string): Tile {
    const obj = this.puzzle.objects.find((o) => o.id === objectId);
    if (!obj) throw new InterventionError(`Unknown object "${objectId}"`);
    if (obj.kind === "obstacle" && this.selection?.objectId === objectId) {
      const mod = obj.modifications.find((m) => m.id === this.selection!.modificationId);
      if (mod) return mod.tile;
    }
    return obj.tile;
  }

  signalGreen(signalId: string): boolean {
    return this.snapshot().signals.find((s) => s.id === signalId)?.green ?? true;
  }

  private findActor(snap: TickSnapshot, actorId: string) {
    const actor = snap.actors.find((a) => a.id === actorId);
    if (!actor) throw new Error(`Unknown actor "${actorId}"`);
    return actor;
  }

  private nodeTile(nodeId: string): Tile {
    const node = this.puzzle.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Unknown node "${nodeId}"`);
    return node;
  }
}
