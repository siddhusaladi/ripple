import type { PuzzleDefinition } from "../simulation/types";

/** Thrown when puzzle data is malformed. `issues` lists every problem found. */
export class PuzzleValidationError extends Error {
  override readonly name = "PuzzleValidationError";

  constructor(readonly issues: readonly string[]) {
    super(`Invalid puzzle definition:\n  - ${issues.join("\n  - ")}`);
  }
}

const MODES = new Set(["foot", "car", "bike"]);
const ACTOR_KINDS = new Set(["pedestrian", "car", "cyclist"]);

/**
 * Validates untrusted puzzle data (e.g. parsed JSON) and returns it as a deeply frozen
 * PuzzleDefinition. Collects all issues before throwing so authors can fix them in one pass.
 */
export function loadPuzzle(raw: unknown): PuzzleDefinition {
  const issues: string[] = [];
  const fail = (msg: string): void => void issues.push(msg);

  if (!isRecord(raw)) throw new PuzzleValidationError(["puzzle must be an object"]);

  for (const key of ["id", "title", "intro", "protagonist"] as const) {
    if (typeof raw[key] !== "string" || raw[key] === "") fail(`"${key}" must be a non-empty string`);
  }
  if (!isPositiveInt(raw.maxTicks)) fail(`"maxTicks" must be a positive integer`);

  // Map (decorative, but node tiles must fall inside it).
  let width = 0;
  let height = 0;
  if (!Array.isArray(raw.map) || raw.map.length === 0 || !raw.map.every((r) => typeof r === "string")) {
    fail(`"map" must be a non-empty array of strings`);
  } else {
    height = raw.map.length;
    width = (raw.map[0] as string).length;
    if (raw.map.some((r) => (r as string).length !== width)) fail(`"map" rows must all have the same length`);
  }

  // Nodes.
  const nodeIds = new Set<string>();
  const tiles = new Set<string>();
  for (const [i, node] of arrayOf(raw.nodes, "nodes", fail).entries()) {
    if (!isRecord(node) || typeof node.id !== "string" || !isInt(node.x) || !isInt(node.y)) {
      fail(`nodes[${i}] must have a string "id" and integer "x", "y"`);
      continue;
    }
    if (nodeIds.has(node.id)) fail(`duplicate node id "${node.id}"`);
    nodeIds.add(node.id);
    const tile = `${node.x},${node.y}`;
    if (tiles.has(tile)) fail(`node "${node.id}" shares tile (${tile}) with another node`);
    tiles.add(tile);
    if (height > 0 && (node.x < 0 || node.y < 0 || node.x >= width || node.y >= height)) {
      fail(`node "${node.id}" is outside the ${width}x${height} map`);
    }
  }
  const knownNode = (id: unknown, where: string): void => {
    if (typeof id !== "string" || !nodeIds.has(id)) fail(`${where} references unknown node ${JSON.stringify(id)}`);
  };

  // Objects (needed before edges, which may reference traffic lights).
  const objectIds = new Set<string>();
  const lightIds = new Set<string>();
  for (const [i, obj] of arrayOf(raw.objects, "objects", fail).entries()) {
    const where = `objects[${i}]`;
    if (!isRecord(obj) || typeof obj.id !== "string" || typeof obj.label !== "string") {
      fail(`${where} must have string "id" and "label"`);
      continue;
    }
    if (objectIds.has(obj.id)) fail(`duplicate object id "${obj.id}"`);
    objectIds.add(obj.id);
    if (!isTile(obj.tile)) fail(`${where}.tile must be { x, y } integers`);
    const mods = arrayOf(obj.modifications, `${where}.modifications`, fail);
    if (mods.length === 0) fail(`${where} must offer at least one modification`);
    const modIds = new Set<string>();
    for (const [j, mod] of mods.entries()) {
      const mWhere = `${where}.modifications[${j}]`;
      if (!isRecord(mod) || typeof mod.id !== "string" || typeof mod.label !== "string" || typeof mod.description !== "string") {
        fail(`${mWhere} must have string "id", "label", "description"`);
        continue;
      }
      if (modIds.has(mod.id)) fail(`${where} has duplicate modification id "${mod.id}"`);
      modIds.add(mod.id);
      if (obj.kind === "traffic_light" && !isCycle(mod.cycle)) fail(`${mWhere}.cycle is invalid`);
      if (obj.kind === "obstacle" && !isTile(mod.tile)) fail(`${mWhere}.tile must be { x, y } integers`);
    }
    if (obj.kind === "traffic_light") {
      lightIds.add(obj.id);
      if (!isCycle(obj.cycle)) fail(`${where}.cycle must have integer period > 0, 0 <= greenTicks <= period, integer offset`);
    } else if (obj.kind === "obstacle") {
      if (typeof obj.appearance !== "string") fail(`${where}.appearance must be a string`);
    } else {
      fail(`${where}.kind must be "traffic_light" or "obstacle"`);
    }
  }

  // Edges.
  for (const [i, edge] of arrayOf(raw.edges, "edges", fail).entries()) {
    const where = `edges[${i}]`;
    if (!isRecord(edge) || !Array.isArray(edge.chain) || edge.chain.length < 2) {
      fail(`${where}.chain must list at least two nodes`);
      continue;
    }
    edge.chain.forEach((id, j) => knownNode(id, `${where}.chain[${j}]`));
    if (!Array.isArray(edge.modes) || edge.modes.length === 0 || !edge.modes.every((m) => MODES.has(m as string))) {
      fail(`${where}.modes must be a non-empty subset of foot, car, bike`);
    }
    if (edge.oneWay !== undefined && typeof edge.oneWay !== "boolean") fail(`${where}.oneWay must be boolean`);
    if (edge.signal !== undefined && !(typeof edge.signal === "string" && lightIds.has(edge.signal))) {
      fail(`${where}.signal must name a traffic_light object`);
    }
  }

  // Landmarks.
  const landmarkIds = new Set<string>();
  for (const [i, lm] of arrayOf(raw.landmarks, "landmarks", fail).entries()) {
    if (!isRecord(lm) || typeof lm.id !== "string" || typeof lm.label !== "string") {
      fail(`landmarks[${i}] must have string "id" and "label"`);
      continue;
    }
    if (landmarkIds.has(lm.id)) fail(`duplicate landmark id "${lm.id}"`);
    landmarkIds.add(lm.id);
    knownNode(lm.node, `landmark "${lm.id}"`);
  }

  // Actors.
  const actorIds = new Set<string>();
  const starts = new Set<string>();
  for (const [i, actor] of arrayOf(raw.actors, "actors", fail).entries()) {
    if (!isRecord(actor) || typeof actor.id !== "string" || typeof actor.label !== "string") {
      fail(`actors[${i}] must have string "id" and "label"`);
      continue;
    }
    if (actorIds.has(actor.id)) fail(`duplicate actor id "${actor.id}"`);
    actorIds.add(actor.id);
    if (!ACTOR_KINDS.has(actor.kind as string)) fail(`actor "${actor.id}" has unknown kind ${JSON.stringify(actor.kind)}`);
    knownNode(actor.start, `actor "${actor.id}" start`);
    knownNode(actor.destination, `actor "${actor.id}" destination`);
    if (actor.start === actor.destination) fail(`actor "${actor.id}" starts at its destination`);
    if (typeof actor.start === "string") {
      if (starts.has(actor.start)) fail(`actor "${actor.id}" shares its start node with another actor`);
      starts.add(actor.start);
    }
  }
  if (typeof raw.protagonist === "string" && !actorIds.has(raw.protagonist)) {
    fail(`protagonist "${raw.protagonist}" is not an actor`);
  }

  if (issues.length > 0) throw new PuzzleValidationError(issues);
  return deepFreeze(raw) as unknown as PuzzleDefinition;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function arrayOf(v: unknown, name: string, fail: (msg: string) => void): unknown[] {
  if (Array.isArray(v)) return v;
  fail(`"${name}" must be an array`);
  return [];
}

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v);
}

function isPositiveInt(v: unknown): v is number {
  return isInt(v) && v > 0;
}

function isTile(v: unknown): boolean {
  return isRecord(v) && isInt(v.x) && isInt(v.y);
}

function isCycle(v: unknown): boolean {
  return (
    isRecord(v) &&
    isPositiveInt(v.period) &&
    isInt(v.greenTicks) &&
    v.greenTicks >= 0 &&
    v.greenTicks <= v.period &&
    isInt(v.offset)
  );
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
