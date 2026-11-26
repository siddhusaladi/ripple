import type { PuzzleDefinition } from "../simulation/types";
import { loadPuzzle } from "./loadPuzzle";
import puzzle001 from "./puzzle-001.json";

export { loadPuzzle, PuzzleValidationError } from "./loadPuzzle";

/** Puzzle 001 "The Intersection", validated and deeply frozen at import time. */
export const PUZZLE_001: PuzzleDefinition = loadPuzzle(puzzle001);
