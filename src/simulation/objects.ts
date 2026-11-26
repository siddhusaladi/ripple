import type {
  EditableObjectDef,
  ObstacleDef,
  SignalCycle,
  Tile,
  TrafficLightDef,
} from "./types";

/**
 * An object the player may change before a run. Each instance is created fresh from its
 * immutable definition for every run, so a reset can never leak a previous edit.
 *
 * Objects expose world effects (a signal schedule, an occupied tile); they never decide
 * outcomes. Whether an edit saves the pedestrian is left entirely to movement and collisions.
 */
export interface EditableObject {
  readonly id: string;
  readonly label: string;
  /** Id of the modification applied this run, or null for the default state. */
  readonly appliedModification: string | null;
  supportsModification(modificationId: string): boolean;
  applyModification(modificationId: string): void;
}

export class TrafficLight implements EditableObject {
  readonly id: string;
  readonly label: string;
  private cycle: SignalCycle;
  private applied: string | null = null;

  constructor(private readonly def: TrafficLightDef) {
    this.id = def.id;
    this.label = def.label;
    this.cycle = def.cycle;
  }

  get appliedModification(): string | null {
    return this.applied;
  }

  supportsModification(modificationId: string): boolean {
    return this.def.modifications.some((m) => m.id === modificationId);
  }

  applyModification(modificationId: string): void {
    const mod = this.def.modifications.find((m) => m.id === modificationId);
    if (!mod) throw new Error(`"${this.id}" does not support modification "${modificationId}"`);
    this.cycle = mod.cycle;
    this.applied = mod.id;
  }

  /** Green at tick t iff ((t + offset) mod period) < greenTicks. */
  isGreen(tick: number): boolean {
    const { period, greenTicks, offset } = this.cycle;
    return mod(tick + offset, period) < greenTicks;
  }
}

/** A movable object (trash can, delivery crate) that blocks whatever node is on its tile. */
export class MovableObstacle implements EditableObject {
  readonly id: string;
  readonly label: string;
  private currentTile: Tile;
  private applied: string | null = null;

  constructor(private readonly def: ObstacleDef) {
    this.id = def.id;
    this.label = def.label;
    this.currentTile = def.tile;
  }

  get appliedModification(): string | null {
    return this.applied;
  }

  get tile(): Tile {
    return this.currentTile;
  }

  supportsModification(modificationId: string): boolean {
    return this.def.modifications.some((m) => m.id === modificationId);
  }

  applyModification(modificationId: string): void {
    const mod = this.def.modifications.find((m) => m.id === modificationId);
    if (!mod) throw new Error(`"${this.id}" does not support modification "${modificationId}"`);
    this.currentTile = mod.tile;
    this.applied = mod.id;
  }
}

export function createEditableObject(def: EditableObjectDef): TrafficLight | MovableObstacle {
  switch (def.kind) {
    case "traffic_light":
      return new TrafficLight(def);
    case "obstacle":
      return new MovableObstacle(def);
  }
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
