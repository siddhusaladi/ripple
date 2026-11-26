import type { SimEvent, SimEventType, SimulationResult } from "../../src/simulation/types";

type EventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;

export function eventsOf<T extends SimEventType>(result: SimulationResult, type: T): EventOf<T>[] {
  return result.events.filter((e): e is EventOf<T> => e.type === type);
}

/** Ticks at which `actorId` entered landmark `landmarkId`, in order. */
export function landmarkTicks(result: SimulationResult, actorId: string, landmarkId: string): number[] {
  return eventsOf(result, "entered_landmark")
    .filter((e) => e.actorId === actorId && e.landmarkId === landmarkId)
    .map((e) => e.tick);
}

export function nodeAt(result: SimulationResult, actorId: string, tick: number): string {
  const snap = result.snapshots[tick];
  if (!snap) throw new Error(`no snapshot for tick ${tick}`);
  const actor = snap.actors.find((a) => a.id === actorId);
  if (!actor) throw new Error(`no actor ${actorId} at tick ${tick}`);
  return actor.node;
}

export function plannedRoute(result: SimulationResult, actorId: string): EventOf<"route_planned"> {
  const e = eventsOf(result, "route_planned").find((r) => r.actorId === actorId);
  if (!e) throw new Error(`no route_planned event for ${actorId}`);
  return e;
}

/** Runs `fn` once, on first use inside a test, so failures are reported per test. */
export function memo<T>(fn: () => T): () => T {
  let cached: { value: T } | undefined;
  return () => (cached ??= { value: fn() }).value;
}
