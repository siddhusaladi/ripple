import type { PuzzleDefinition } from "../simulation/types";
import puzzle001 from "./puzzle-001.json";

// Baseline: the raw JSON is trusted as-is. Validation is added with the engine.
export const PUZZLE_001 = puzzle001 as PuzzleDefinition;
