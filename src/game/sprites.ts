// Rendering-only mapping from puzzle data to frames of the Kenney RPG Urban Pack sheet
// (public/assets/kenney-rpg-urban/tilemap_packed.png, 27 x 18 tiles of 16 px, CC0).
// Frame index = row * 27 + column. Nothing here affects simulation rules.
import type { ActorKind } from "../simulation/types";

export const TILE = 16;
export const SHEET_KEY = "urban";
export const SHEET_URL = "assets/kenney-rpg-urban/tilemap_packed.png";

/** Base ground frame for each map character. */
export const GROUND_FRAMES: Readonly<Record<string, number>> = {
  "#": 99, // red roof (generic buildings)
  H: 207, // orange roof (Maya's house)
  C: 180, // orange roof (cafe)
  d: 283, // door
  ".": 28, // grass
  t: 28, // grass under a tree
  s: 36, // sidewalk
  "=": 406, // asphalt
  z: 405, // crosswalk stripes
  p: 109, // plaza paving
  b: 460, // bike path (dark asphalt)
};

/** Frames drawn on top of the ground. */
export const OVERLAY_FRAMES: Readonly<Record<string, number>> = {
  t: 292, // small tree
};

/** Bike symbol painted on a few bike-path tiles (tile keys "x,y"). */
export const BIKE_SYMBOL_FRAME = 469;
export const BIKE_SYMBOL_TILES: readonly string[] = ["19,2", "18,4"];

export const ACTOR_FRAMES: Readonly<Record<ActorKind, readonly number[]>> = {
  pedestrian: [104], // orange-haired character
  cyclist: [428], // dark-haired character with headband
  car: [395, 422], // 1x2 taxi, drawn rotated to face east
};

/** Frames for editable objects, keyed by object kind / obstacle appearance. */
export const OBJECT_FRAMES: Readonly<Record<string, number>> = {
  traffic_light: 408,
  trash_can: 280,
  crate: 273,
};

/** Which map characters each travel mode may stand on (used to validate art against the graph). */
export const WALKABLE_TILES: Readonly<Record<"foot" | "car" | "bike", string>> = {
  foot: "spz",
  car: "=z",
  bike: "b",
};
