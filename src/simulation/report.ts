// Human-readable text derived only from simulation events. Used by the headless demo and the UI.
import type { PuzzleDefinition, SimEvent, SimulationResult } from "./types";

export function formatEvent(puzzle: PuzzleDefinition, e: SimEvent): string {
  const actor = (id: string): string => puzzle.actors.find((a) => a.id === id)?.label ?? id;
  const landmark = (id: string): string => puzzle.landmarks.find((l) => l.id === id)?.label ?? id;
  const prefix = `tick ${String(e.tick).padStart(2)}:`;
  switch (e.type) {
    case "object_modified":
      return `${prefix} ${e.objectId} modified (${e.modificationId})`;
    case "route_planned":
      return `${prefix} ${actor(e.actorId)} planned a ${e.segments}-segment route`;
    case "route_changed":
      return `${prefix} ${actor(e.actorId)} route recalculated: ${e.baselineSegments ?? "none"} -> ${e.segments} segments`;
    case "no_route":
      return `${prefix} ${actor(e.actorId)} has no route to its destination`;
    case "waited_at_signal":
      return `${prefix} ${actor(e.actorId)} waited at red ${e.signalId} (${e.nodeId})`;
    case "entered_landmark":
      return `${prefix} ${actor(e.actorId)} entered ${landmark(e.landmarkId)}`;
    case "collision":
      return `${prefix} COLLISION at ${e.nodeId}: ${e.actorIds.map(actor).join(" + ")}`;
    case "died":
      return `${prefix} ${actor(e.actorId)} died`;
    case "arrived":
      return `${prefix} ${actor(e.actorId)} arrived`;
    case "completed":
      return `${prefix} simulation completed — ${e.success ? "SURVIVED" : "FAILED"} (${e.reason})`;
  }
}

/**
 * Explains a run by diffing it against the unmodified run (`baseline`): which routes changed,
 * who waited, which landmark times moved, and how it ended. Every sentence is computed from
 * events; nothing is keyed on which object was edited.
 */
export function explainRun(puzzle: PuzzleDefinition, result: SimulationResult, baseline: SimulationResult): string[] {
  const label = (id: string): string => puzzle.actors.find((a) => a.id === id)?.label ?? id;
  const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  const lines: string[] = [];

  if (result.intervention) {
    const obj = puzzle.objects.find((o) => o.id === result.intervention!.objectId);
    const mod = obj?.modifications.find((m) => m.id === result.intervention!.modificationId);
    lines.push(`You changed the ${obj?.label.toLowerCase() ?? result.intervention.objectId}: ${mod?.label ?? ""}.`);
  }

  for (const e of result.events) {
    if (e.type === "route_changed") {
      const delta = e.baselineSegments === null ? "" : ` (${signed(e.segments - e.baselineSegments)} segments)`;
      lines.push(`${cap(label(e.actorId))}'s usual route was blocked, so they took a different one${delta}.`);
    } else if (e.type === "no_route") {
      lines.push(`${cap(label(e.actorId))} could not find any route.`);
    }
  }

  for (const [actorId, ticks] of waitsByActor(result.events)) {
    const span = ticks.length === 1 ? `t=${ticks[0]}` : `t=${ticks[0]}–${ticks[ticks.length - 1]}`;
    lines.push(`${cap(label(actorId))} waited at a red light for ${ticks.length} s (${span}).`);
  }

  // Landmark timing: always report landmarks the protagonist used; others only when changed.
  const protagonistLandmarks = new Set(
    [...result.events, ...baseline.events]
      .filter((e) => e.type === "entered_landmark" && e.actorId === puzzle.protagonist)
      .map((e) => (e as Extract<SimEvent, { type: "entered_landmark" }>).landmarkId),
  );
  for (const lm of puzzle.landmarks) {
    for (const actor of puzzle.actors) {
      const now = firstEntry(result, actor.id, lm.id);
      const before = firstEntry(baseline, actor.id, lm.id);
      if (now === null && before === null) continue;
      if (now === before && !protagonistLandmarks.has(lm.id)) continue;
      const who = cap(actor.label);
      if (now === null) lines.push(`${who} never reached ${lm.label} (normally t=${before}).`);
      else if (now === before) lines.push(`${who} reached ${lm.label} at t=${now}${result.intervention ? ", as before" : ""}.`);
      else if (before === null) lines.push(`${who} reached ${lm.label} at t=${now}.`);
      else lines.push(`${who} reached ${lm.label} at t=${now} instead of t=${before}.`);
    }
  }

  for (const e of result.events) {
    if (e.type === "collision") lines.push(`${e.actorIds.map((id) => cap(label(id))).join(" and ")} collided at t=${e.tick}.`);
  }

  const hero = cap(label(puzzle.protagonist));
  if (result.success) {
    const t = result.events.find((e) => e.type === "arrived" && e.actorId === puzzle.protagonist)?.tick;
    lines.push(`${hero} made it safely at t=${t}.`);
  } else if (result.reason === "killed") {
    lines.push(`${hero} did not survive. Rewind and try a different change.`);
  } else {
    lines.push(`${hero} never arrived (${result.reason}).`);
  }
  return lines;
}

function firstEntry(result: SimulationResult, actorId: string, landmarkId: string): number | null {
  const e = result.events.find((x) => x.type === "entered_landmark" && x.actorId === actorId && x.landmarkId === landmarkId);
  return e ? e.tick : null;
}

function waitsByActor(events: readonly SimEvent[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const e of events) {
    if (e.type !== "waited_at_signal") continue;
    map.set(e.actorId, [...(map.get(e.actorId) ?? []), e.tick]);
  }
  return map;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}
