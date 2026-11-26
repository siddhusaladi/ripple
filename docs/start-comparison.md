# Starting Point vs. Implementation

| | Commit | What it contains |
|---|---|---|
| GitHub initial commit | `6c8ae8b` | one-line README, Node `.gitignore` template |
| Scaffold | `16a2415` | npm/TypeScript/Vite/Phaser/Vitest setup, placeholder boot scene |
| **Baseline — tag `start`** | `9dcdf7d02aaf962afe2083495bdbc9459d864473` | puzzle data, public types, hand-derived spec, scenario tests; `runSimulation` throws "not implemented" |
| Engine | `f95b807` | graph routing, signals, obstacles, collisions, tick loop; same tests pass unchanged |
| Validation + demo | `320aa3d` | puzzle validation, determinism/reset/validation/headless tests, headless demo |

## Capability the starting point cannot handle

Given Puzzle 001 and an intervention, compute the resulting timeline — routes,
signal waits, landmark arrival ticks, collisions, deaths — from general rules.
At `start` the app builds and the test runner runs, but `runSimulation` has no
movement, routing, signal, or collision logic.

## The check

```bash
npm test -- tests/simulation/scenarios.test.ts
```

- At `start`: **14 failed / 14**, exit code 1
  (`docs/evidence/start-baseline-npm-test.txt`, captured from a clean worktree
  of the tag).
- At `320aa3d`: the same 14 scenario tests pass, inside a full suite of
  **35 passed / 35**, exit code 0 (`docs/evidence/scenarios-passing-npm-test.txt`).

`git diff start -- tests/simulation/scenarios.test.ts tests/simulation/helpers.ts`
is empty: the expectations were not edited after the baseline.

## Reproduce

```bash
git worktree add ../ripple-start start
cd ../ripple-start && npm ci && npm test   # 14 failed
cd - && git worktree remove ../ripple-start
npm ci && npm test                          # all pass
```

## What was added

`src/simulation/` (NavGraph, objects, Actor, World, Simulation, report),
`src/puzzles/loadPuzzle.ts`, five more test files, and
`scripts/demo-headless.ts`. See `docs/architecture.md`.
