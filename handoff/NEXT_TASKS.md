# Next Tasks (priority order)

## T1 Review session 1 work (Siddharth) — before anything is pushed

- Read `docs/puzzle-spec.md` and `handoff/PROJECT_SPEC.md` §Simulation rules,
  then `src/simulation/Simulation.ts`. Check that the rules match your intent;
  ask the agent about anything you can't explain.
- Run `npm ci && npm test && npm run demo:headless`.
- Push when satisfied: `git push origin main --follow-tags` (the `--follow-tags`
  is needed so the `start` tag reaches GitHub).

## T2 TimelineController (pure TS, tested) — Milestone 4a

- **Implement:** `src/game/TimelineController.ts`: holds the puzzle, the
  selected intervention, and the precomputed `SimulationResult`. Provides
  `select(intervention | null)`, `play()`, `rewind()`, `reset()`,
  `update(dtMs)`, a float `playhead` (ticks), and
  `actorPose(id) → { x, y, status, waiting }`, interpolated between
  `snapshots[floor]` and `snapshots[floor+1]`, with status taken from
  `snapshots[floor]`. No Phaser imports.
- **Accept:** a test in `tests/game/timeline.test.ts` covers the playhead
  clamping at `endTick`, interpolation halfway between two ticks, and that
  `reset()` clears the selection and result. The playback speed must not
  change the result.
- **Depends on:** nothing. **Tests:** `npm test`.

## T3 GameScene + DOM UI — Milestone 4b

- **Implement:** `src/game/GameScene.ts` draws `puzzle.map` tiles (generated
  shapes for now), objects at their current/edited tiles, actors from
  `actorPose`, and the signal color from `snapshots[t].signals`.
  `src/ui/controls.ts` (DOM): title/intro, three object buttons (one
  selectable at a time), Play/Replay, Rewind, Reset, a timeline bar with tick
  label and event markers, a result banner, and `explainRun` lines.
  `src/main.ts` wires them together. Clicking an object in the scene selects
  it too.
- **Accept:** a player can watch the crash, rewind, choose each object,
  replay, and see the correct outcome; the visual ticks match
  `npm run demo:headless`; no console errors; `npm run build` passes.
- **Depends on:** T2.

## T4 Kenney RPG Urban Kit assets

- Download the pack and verify the CC0 license text inside it. Copy only the
  tiles/sprites used into `public/assets/kenney-rpg-urban/` with the license
  file. Record the exact files in `docs/external-sources.md`. Swap the
  generated shapes for sprites in `GameScene` only.
- **Accept:** game unchanged in behavior; tests unchanged.

## T5 Evidence for the slides

- Repeat the D4 check for the obstacle-blocking and collision rules; record
  the results in `DECISIONS.md`.
- Log the next real bug fully in `BUG_LOG.md` (needed for slide 5).
- Students choose the two slide decisions (candidates ★ in `DECISIONS.md`).
- Fill in EIDs and emails in `docs/proposal-feedback.md`.

## T6 (Optional, only after T1–T5) Daily puzzle — Milestone 6

- Second puzzle JSON plus its own hand derivation and scenario tests;
  `selectDailyPuzzle(catalog, date)` by UTC day; same-day/next-day tests.
