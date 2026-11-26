# Architecture

```text
src/puzzles/puzzle-001.json ──loadPuzzle()──▶ PuzzleDefinition (validated, frozen)
                                                   │
                         Intervention | null ──────┤
                                                   ▼
                                       Simulation (src/simulation/)
                         World ─ NavGraph, TrafficLight, MovableObstacle, landmarks
                         Actor × n (pedestrian, car, cyclist)
                                                   │ run()
                                                   ▼
                     SimulationResult { events[], snapshots[0..endTick], success }
                          │                                │
              scripts/demo-headless.ts           (planned) TimelineController → GameScene (Phaser)
              tests/simulation/*.test.ts                   DOM controls / explanation (src/ui/)
```

## Responsibilities

| Unit | File | Responsibility |
|---|---|---|
| `loadPuzzle` | `src/puzzles/loadPuzzle.ts` | Validate untrusted puzzle JSON; collect all issues; deep-freeze |
| `NavGraph` | `src/simulation/NavGraph.ts` | Nodes, tile lookup, mode-filtered directed edges, BFS shortest path with declaration-order tie-break |
| `TrafficLight` | `src/simulation/objects.ts` | Signal cycle; `isGreen(tick)`; retime modification |
| `MovableObstacle` | `src/simulation/objects.ts` | Current tile; move modification (trash can, crate) |
| `Actor` | `src/simulation/Actor.ts` | Position, route progress, status; kind traits as data |
| `World` | `src/simulation/World.ts` | Graph + objects for one run: blocked nodes, signal lookup, landmarks |
| `Simulation` | `src/simulation/Simulation.ts` | Clock and all mutable state; applies the tick order in PROJECT_SPEC |
| `report` | `src/simulation/report.ts` | Event formatting; explanation by diffing a run against the unmodified run |

## Rules that keep it testable

- `src/simulation/` and `src/puzzles/` import nothing from Phaser and use no DOM,
  clock, or randomness (`tests/simulation/headless.test.ts` scans for this).
- A `Simulation` is single-use and built from frozen data, so "reset" means
  constructing a new one. Nothing carries over between replays.
- The renderer will consume `snapshots`, a complete per-tick state, and
  interpolate between them for display only. It never computes outcomes.
- Objects only change world facts (a signal schedule, an occupied tile).
  Outcomes come from routing, movement, and collisions. No code branches on
  which object was edited.
