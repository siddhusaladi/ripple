// Public entry point of the headless simulation. Safe to import from Node: no Phaser, no DOM.
import { Simulation } from "./Simulation";
import type { Intervention, PuzzleDefinition, SimulationResult } from "./types";

export type * from "./types";
export { InterventionError, Simulation } from "./Simulation";
export { NavGraph } from "./NavGraph";
export { KIND_TRAITS } from "./Actor";

/** Runs a puzzle from tick 0 to completion with at most one intervention. */
export function runSimulation(puzzle: PuzzleDefinition, intervention: Intervention | null): SimulationResult {
  return new Simulation(puzzle, intervention).run();
}
