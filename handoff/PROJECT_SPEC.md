# RIPPLE — Project Specification

Permanent source of truth. Changes to anything below require a recorded,
student-approved entry in `handoff/DECISIONS.md`. Do not edit silently.

## Concept

A browser pixel-art puzzle about the butterfly effect. A pedestrian (Maya)
walks to a cafe; a car hits her at an intersection. The player rewinds, changes
**one** environmental object, and replays a deterministic simulation. Small
changes propagate through general movement, routing, signal, and collision
rules; some edits save her and some do not.

## MVP scope

- One puzzle: **Puzzle 001 "The Intersection"** (`src/puzzles/puzzle-001.json`,
  derivations in `docs/puzzle-spec.md`).
- Actors: pedestrian (protagonist), car, cyclist.
- Three editable objects: traffic light, trash can, delivery crate; each has one
  supported modification in Puzzle 001.
- At most one modification per replay, applied before tick 0. Reset restores
  the unmodified puzzle.
- Rewind/replay, timeline indicator, success/failure message, event-derived
  explanation of the chain reaction.
- Headless deterministic simulation with automated tests.

Out of scope: accounts, servers, multiplayer, leaderboards, procedural maps,
physics, multiple simultaneous edits, mid-run edits. Daily puzzles are a
planned extension (see below), not part of the MVP.

## Architecture constraints

- TypeScript (strict), Phaser 3.90.0, Vite, Vitest, Node 22 LTS, npm lockfile.
- `src/simulation/` and `src/puzzles/` are pure TypeScript: no Phaser, no DOM,
  no wall clock, no unseeded randomness.
- Phaser renders snapshots produced by the simulation; it never decides
  outcomes.
- Puzzles are data (JSON) validated by `loadPuzzle`; no per-puzzle engine code
  and no per-object outcome shortcuts.

## Simulation rules

### World

- **Graph.** Nodes are traversable positions with tile coordinates (unique tile
  per node). Edges are declared as chains, each permitting a set of modes
  (`foot`, `car`, `bike`), two-way unless `oneWay`. An edge may name a traffic
  light (`signal`) that controls entry along it.
- **Actors.** Each kind has fixed properties:

  | Kind | Mode | Obeys signals | Vulnerable |
  |---|---|---|---|
  | pedestrian | foot | no | yes |
  | cyclist | bike | yes | yes |
  | car | car | yes | no (vehicle) |

- **Traffic light.** Green at tick `t` iff `((t + offset) mod period) <
  greenTicks`. A signal-obeying actor may traverse a signalled edge during tick
  `t` only if the light is green at `t`; otherwise it waits on its current node.
- **Obstacles.** An obstacle occupies one tile. If a graph node is on that
  tile, the node is blocked for all actors. Obstacles do not move during a run.
- **Landmarks.** Named nodes (e.g. `crossing`) used for event reporting only.

### Time

- Integer ticks; one tick = one second of simulated time. Tick 0 is the
  starting state. Each later tick, an active actor advances at most one edge.
- No dependence on frame rate or wall-clock time.

### Order of operations

**Setup (tick 0)**

1. Apply the intervention (if any) to its object; emit `object_modified`.
2. Compute blocked nodes from obstacle tiles.
3. Plan each actor's route: breadth-first shortest path (fewest segments) from
   start to destination over edges allowing the actor's mode, never entering a
   blocked node. Ties are broken by edge declaration order (deterministic).
   Emit `route_planned`. Also plan the route in the unmodified puzzle; if the
   two differ, emit `route_changed` with both lengths. If no route exists, the
   actor becomes `stuck` (`no_route`).
4. Record snapshot 0.

**Each tick t = 1, 2, …** (actors processed in declaration order)

1. *Movement restrictions:* for each active actor, take the next edge on its
   route; if the edge is signalled, the actor obeys signals, and the light is
   red at `t`, the actor waits (`waited_at_signal`).
2. *Next movement:* every non-waiting active actor's intended node is the next
   route node.
3. *Update positions:* all intended moves are applied simultaneously.
4. *Collisions:* actors still on the map (status other than `arrived`) that
   share a node, where at least one of them entered it this tick, collide
   (`collision`, actor ids sorted). If the group contains a vehicle, every
   vulnerable actor in it dies (`died`) and every active vehicle becomes
   `crashed`. A collision with no vehicle has no further effect.
5. *Events:* landmark entries (`entered_landmark`) for actors that moved onto
   a landmark node; arrivals (`arrived`) for surviving actors now at their
   destination — arrived actors leave the map.
6. *Completion:* the run ends when no actor is `active`, or at `maxTicks`.
   Emit `completed`.
7. Record snapshot `t`.

Within a tick, events are emitted in the order: waits, landmark entries,
collisions, deaths, arrivals, completed.

### Outcome

Success iff the protagonist's final status is `arrived`. Otherwise failure with
reason `killed`, `no_route`, or `timeout`.

## Expected chain reactions (Puzzle 001)

Derived by hand in `docs/puzzle-spec.md`; verified by
`tests/simulation/scenarios.test.ts`.

| Scenario | Edit | Key events | Result |
|---|---|---|---|
| 0 | none | pedestrian and car enter crossing at 12; collision at 12 | death at 12 |
| 1 | traffic light retimed (red 1 s earlier) | car waits 12–14, enters crossing at 15; pedestrian crosses at 12 | survives |
| 2 | trash can onto sidewalk | pedestrian reroutes +4 segments; car crosses at 12; pedestrian crosses at 16 | survives |
| 3 | crate into bike path | cyclist reroutes +3, side junction at 11 (not 8); pedestrian/car unchanged | death at 12 |

## Acceptance criteria

- All four scenarios produce the events above from the general rules.
- Repeated runs are identical (events, snapshots, outcome).
- Reset leaves no state from a previous intervention.
- Malformed puzzles and invalid interventions are rejected with clear errors.
- The simulation imports and runs in Node without Phaser or the DOM.
- A player can watch the accident, rewind, apply one edit, replay, and read
  the outcome and explanation in the browser.

## Planned extensions (not implemented)

- **Daily puzzles:** a curated catalog of validated puzzle JSON files; the
  puzzle for a date is chosen deterministically by UTC calendar day (rollover
  at 00:00 UTC), e.g. `catalog[daysSinceEpoch(dateUTC) mod catalog.length]`,
  with the date injectable for tests. A finite catalog repeats in a documented
  rotation. No AI or external service generates puzzles.
- Multiple edits per replay; more modification options per object; obstacles
  appearing mid-run with re-routing.
