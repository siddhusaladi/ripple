// Public entry point of the headless simulation.
import type { Intervention, PuzzleDefinition, SimulationResult } from "./types";

export type * from "./types";

/**
 * Runs a puzzle from tick 0 to completion with at most one intervention.
 *
 * BASELINE (tag `start`): not implemented. The scenario tests in
 * tests/simulation/scenarios.test.ts describe the behavior to build.
 */
export function runSimulation(puzzle: PuzzleDefinition, intervention: Intervention | null): SimulationResult {
  void puzzle;
  void intervention;
  throw new Error("Simulation not implemented: movement, routing, signals, and collisions are missing");
}
