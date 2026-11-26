# Decisions

Status values: **made** (implemented, with evidence), **planned** (agreed, not
yet implemented). For the slides, the students should choose two decisions
they own and can defend. Candidates are marked ★.

---

## D1 ★ Integer fixed-tick simulation with graph-based BFS routing — made

- **Problem:** chain reactions must be reproducible and explainable to the
  tick, independent of frame rate.
- **Selected:** integer ticks (1 tick = 1 s), one edge per tick, routes chosen
  by BFS over a mode-filtered graph with declaration-order tie-break.
- **Alternatives:** (a) continuous movement scaled by frame delta time;
  (b) per-NPC scripted waypoint lists.
- **Why:** (a) makes arrival times depend on the frame rate and float
  rounding. (b) cannot react to a blocked sidewalk without writing a second
  script for every edit, which is exactly the kind of per-object outcome the
  project forbids.
- **Agent asked to:** implement `NavGraph.shortestPath` and the tick loop per
  PROJECT_SPEC (session 1, Siddharth).
- **Code:** `src/simulation/NavGraph.ts`, `src/simulation/Simulation.ts` (`f95b807`).
- **Evidence:** the hand-derived reroutes (+4 pedestrian, +3 cyclist) come out
  of BFS and match the tests written at `start`.
  `tests/simulation/determinism.test.ts` runs each scenario 25× and the
  results are identical.
- **Result:** 14/14 scenario tests pass unchanged; determinism tests pass.
- **Follow-up:** routes are planned once at tick 0, so dynamic obstacles are a
  known limitation (see README).

## D2 Topology: one diagonal edge to allow a +3 detour — made

- **Problem:** the approved spec needs the cyclist's detour to be exactly +3
  segments. On a 4-connected grid every detour adds an even number of
  segments (x+y parity), so +3 cannot be built from grid edges alone.
- **Selected:** keep the approved timing and add one non-grid (diagonal) edge
  `b17_4 → b16_3` to the park trail.
- **Alternative:** change the spec to +2 or +4, which moves the side-junction
  tick from 11 to 10 or 12.
- **Why:** the spec says to adjust the world rather than an approved
  expectation where possible.
- **Code:** `src/puzzles/puzzle-001.json`; reasoning in `docs/puzzle-spec.md`.
- **Evidence:** Scenario 3 tests (side junction at 11) pass.

## D3 Data-driven actor kinds and one obstacle class — made

- **Problem:** pedestrian, car, and cyclist differ only in travel mode, signal
  obedience, and vulnerability; trash can and crate differ only in position.
- **Selected:** one `Actor` class plus a `KIND_TRAITS` table; one
  `MovableObstacle` class. `TrafficLight` and `MovableObstacle` share the
  `EditableObject` interface.
- **Alternative:** `Pedestrian`/`Car`/`Cyclist` and `TrashCan`/`DeliveryCrate`
  subclasses.
- **Why:** subclasses would be empty or near-duplicate. With data-driven
  traits, a new puzzle can add actors without new code.
- **Code:** `src/simulation/Actor.ts`, `src/simulation/objects.ts`.

## D4 ★ Test strategy: assert whole event chains, then check the tests catch broken rules — made

- **Problem:** a test that checks only "survived: true" would pass for a
  hardcoded `if (edit === "trafficLight")` shortcut.
- **Selected:** scenario tests assert exact routes (node lists), wait ticks,
  landmark entry ticks, collision node/tick/participants, deaths, end tick,
  and outcome. Expectations come from the hand derivation in
  `docs/puzzle-spec.md`, written before the engine.
- **Alternative:** final-outcome-only tests, or snapshot tests recorded from
  the implementation (which would just confirm whatever the code does).
- **Measurement (session 1):** we temporarily made cars ignore signals
  (`KIND_TRAITS.car.obeysSignals = false`) and ran the suite.
- **Result:** 4 tests failed (three Scenario 1 tests and the signal
  explanation test); 31 passed. With the rule restored: 35/35. An
  outcome-only Scenario 1 test would also have failed here, but it could not
  say whether the car waited at 12–14 or entered at 15.
- **Follow-up (session 2), same method on the other two core rules:**

  | Mutation | Tests failing (of 52) | Which |
  |---|---|---|
  | M1: cars ignore signals (session 1, 35-test suite) | 4 of 35 | Scenario 1 ×3, signal explanation |
  | M2: obstacles never block (`World.blockedNodes` → empty) | 9 | Scenario 2 ×3, Scenario 3 ×3, both affected explanations, headless demo |
  | M3: collisions ignored (`resolveCollisions` no-op) | 6 | Scenario 0 ×2, Scenario 3 collision, crate explanation, Node-run check, timeline end tick |

  Each rule is guarded by the tests of the scenarios that depend on it.
- **What this does not establish:** the determinism tests and the
  browser-vs-headless tests (`tests/game/timeline.test.ts`) passed under
  **every** mutation. They show consistency (same input → same output; the
  UI shows what the engine computed), not correctness. Correctness rests on
  the hand-derived scenario expectations.

## D5 ★ Simulation separated from Phaser; renderer plays back precomputed snapshots — made

- **Problem:** Phaser's update loop is frame-driven, and outcomes must not
  depend on it.
- **Selected:** run the whole simulation headlessly when Replay is pressed.
  The renderer interpolates between `snapshots[t]` and `snapshots[t+1]` for
  display only.
- **Alternative:** call `simulation.step()` from `GameScene.update()` on a
  timer.
- **Why:** the result (outcome, explanation, timeline markers) is known
  before playback, so the UI can show event markers on the timeline. Tests
  and the browser use the same code path, and playback speed cannot change
  outcomes.
- **Agent asked to (session 2):** build `TimelineController` (pure TS) and a
  `GameScene` that only reads it.
- **Code:** `src/game/TimelineController.ts`, `src/game/GameScene.ts`
  (`0219c51`, `8f91747`).
- **Evidence:** `tests/simulation/headless.test.ts` checks that simulation
  code has no Phaser/DOM/clock references and that the demo runs in a
  separate Node process. `tests/game/timeline.test.ts` checks that, for all
  four scenarios, the pose the scene draws at every tick equals the headless
  snapshot, and that frame steps of 5/16/33/250 ms and two playback speeds
  give byte-identical results. `scripts/browser_smoke.py` checks that the real
  browser shows the same four outcomes and end ticks as
  `npm run demo:headless`.
- **Result:** all pass. Playback speed is a UI toggle with no effect on
  outcomes.
- **Follow-up:** see the limitation recorded under D4. These tests prove the
  UI matches the engine, not that the engine is right.

## D6 Controls and text in the DOM, not drawn in Phaser — made

- **Problem:** the player needs buttons, a timeline, and several lines of
  explanation next to a 384 × 208 px pixel-art canvas.
- **Selected:** an HTML panel (`src/ui/controls.ts`) beside the canvas; Phaser
  draws only the world.
- **Alternative:** Phaser text and button objects inside the canvas.
- **Why:** text drawn into a small canvas and scaled up is blurry or
  oversized. DOM buttons get keyboard focus, hover, and disabled states for
  free, and Playwright can target them directly. Clicking objects in the
  canvas still works for players who prefer it.
- **Code:** `src/ui/controls.ts`, `src/ui/style.css`, `index.html` (`8f91747`).

## D7 Asset adaptation: rotated taxi, drawn signal lamp — made

- **Problem:** the Kenney pack's vehicles are front/back views only, and its
  traffic-light sprites have no separate red/green frames.
- **Selected:** rotate the 1 × 2 taxi sprite −90° so it reads as a top-down
  car heading east; draw the signal state as a colored circle on the pole,
  driven by `snapshots[t].signals`.
- **Alternative:** hand-draw new sprites, or use a different pack.
- **Why:** keeps one consistent, licensed art source. The light's color comes
  from simulation state, so it can never disagree with the car's behavior.
- **Code:** `src/game/sprites.ts`, `src/game/GameScene.ts`.
