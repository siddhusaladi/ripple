import type { ActorDef, ActorKind, ActorSnapshot, ActorStatus, Mode } from "./types";

/** Fixed movement and collision properties of each actor kind (see PROJECT_SPEC §World). */
export interface KindTraits {
  readonly mode: Mode;
  readonly obeysSignals: boolean;
  /** Vulnerable actors die when a vehicle collides with them. Non-vulnerable actors are vehicles. */
  readonly vulnerable: boolean;
}

export const KIND_TRAITS: Readonly<Record<ActorKind, KindTraits>> = {
  pedestrian: { mode: "foot", obeysSignals: false, vulnerable: true },
  cyclist: { mode: "bike", obeysSignals: true, vulnerable: true },
  car: { mode: "car", obeysSignals: true, vulnerable: false },
};

/**
 * A moving entity. Kinds differ only in data (KIND_TRAITS), so one class covers
 * pedestrians, cars, and cyclists; see DECISIONS.md D3.
 */
export class Actor {
  readonly id: string;
  readonly kind: ActorKind;
  readonly label: string;
  readonly traits: KindTraits;
  readonly destination: string;

  private route: readonly string[] = [];
  private routeIndex = 0;
  private currentNode: string;
  private currentStatus: ActorStatus = "active";
  private isWaiting = false;

  constructor(def: ActorDef) {
    this.id = def.id;
    this.kind = def.kind;
    this.label = def.label;
    this.traits = KIND_TRAITS[def.kind];
    this.destination = def.destination;
    this.currentNode = def.start;
  }

  get node(): string {
    return this.currentNode;
  }

  get status(): ActorStatus {
    return this.currentStatus;
  }

  get waiting(): boolean {
    return this.isWaiting;
  }

  get isActive(): boolean {
    return this.currentStatus === "active";
  }

  /** Still physically on the map (can be collided with). */
  get isOnMap(): boolean {
    return this.currentStatus !== "arrived";
  }

  /** Assigns a planned route; route[0] must be the current node. */
  setRoute(route: readonly string[]): void {
    if (route[0] !== this.currentNode) throw new Error(`Route for ${this.id} must start at ${this.currentNode}`);
    this.route = route;
    this.routeIndex = 0;
  }

  /** Next node on the route, or null if at the end. */
  nextNode(): string | null {
    return this.route[this.routeIndex + 1] ?? null;
  }

  setWaiting(waiting: boolean): void {
    this.isWaiting = waiting;
  }

  advance(): void {
    const next = this.nextNode();
    if (next === null) throw new Error(`${this.id} has no next node`);
    this.routeIndex += 1;
    this.currentNode = next;
  }

  markStuck(): void {
    this.currentStatus = "stuck";
  }

  markArrived(): void {
    this.currentStatus = "arrived";
    this.isWaiting = false;
  }

  /** Outcome of a collision with a vehicle: vulnerable actors die, vehicles crash. */
  markHit(): void {
    this.currentStatus = this.traits.vulnerable ? "dead" : "crashed";
    this.isWaiting = false;
  }

  snapshot(): ActorSnapshot {
    return { id: this.id, node: this.currentNode, status: this.currentStatus, waiting: this.isWaiting };
  }
}
