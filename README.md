# RIPPLE

A browser-based pixel-art puzzle game about the butterfly effect. Maya walks to
a cafe and is hit by a car at an intersection. Rewind, change one object in the
neighborhood, and replay a deterministic simulation to see whether the chain
reaction saves her.

CS 378 final project: Siddharth Saladi and Akshay Kondala.
Repository: https://github.com/siddhusaladi/ripple

> **Status:** the headless simulation of Puzzle 001 is complete and tested.
> The playable browser game is **not built yet**: `npm run dev` shows a
> placeholder screen. See `handoff/CURRENT_STATE.md`.

## Requirements

- Node.js 22 LTS (>= 22.12.0; `.nvmrc` provided). Developed on 22.17.1.
- npm (lockfile committed). No API keys, accounts, or external services.

## Commands

```bash
npm ci                    # install exact dependency versions
npm run dev               # dev server at http://localhost:5173
npm run build             # typecheck + production build into dist/
npm test                  # full headless test suite (Vitest, Node environment)
npm run demo:headless     # run all four scenarios in Node and print the event logs
npm run demo:headless -- trash_can   # one scenario: none | traffic_light | trash_can | delivery_crate
```

## Puzzle 001 at a glance

| Edit | Result |
|---|---|
| none | Maya and the car enter the crossing at tick 12 and collide; she dies |
| traffic light retimed | car waits at red during ticks 12–14 and enters at 15; Maya survives |
| trash can onto sidewalk | Maya reroutes (+4 segments), crosses at 16 after the car; survives |
| crate into bike path | cyclist reroutes (+3), side junction at 11 not 8; Maya still dies at 12 |

Derivation: `docs/puzzle-spec.md`. Rules: `handoff/PROJECT_SPEC.md`.

## Reproducing results

- **Original failure:** `npm run demo:headless -- none`. Look for
  `tick 12: COLLISION at x14_9` and `FAILED (killed)`.
- **Successful intervention:** `npm run demo:headless -- trash_can` (or
  `traffic_light`) ends with `SURVIVED`.
- **Starting point vs. now:** the scenario tests fail on tag `start` and pass
  now. See `docs/start-comparison.md` for the exact commands and the captured
  output in `docs/evidence/`.

## Project layout

```text
src/simulation/   headless engine (no Phaser/DOM): NavGraph, objects, Actor, World, Simulation, report
src/puzzles/      puzzle JSON + loadPuzzle validator
src/game/, src/ui/  (Milestone 4) playback controller, Phaser scene, DOM controls
src/main.ts       browser entry (placeholder boot scene for now)
scripts/          demo-headless.ts
tests/            Vitest suites + fixtures
docs/             architecture, puzzle spec, sources, proposal feedback, evidence
handoff/          spec, current state, next tasks, decisions, bugs, ownership, session log, agent rules
```

## Known limitations

- One modification per replay; the API accepts a single intervention.
- Routes are planned once at tick 0. Nothing blocks or unblocks mid-run, and
  actors never re-plan.
- Collisions are detected only when actors share a node at the end of a tick.
  Two actors swapping across the same edge in one tick are not detected.
  Puzzle 001 has no such case.
- The car does not perceive pedestrians, and pedestrians ignore signals
  (this is what makes the accident happen).
- Only one puzzle, with one modification per object. Daily puzzles are a
  documented plan, not a feature.

## Credits

Libraries and asset status: `docs/external-sources.md`. Built with
substantial help from Claude Code. See `handoff/OWNERSHIP.md`.
