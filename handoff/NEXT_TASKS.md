# Next Tasks (priority order)

Deadline: **Tuesday, December 1, 2026, 3:00 PM.** The MVP is playable. What
remains is mostly ownership, evidence, and the presentation.

## T0 Siddharth: review session 2 (push already done)

- Play every scenario by hand using `handoff/MANUAL_PLAYTEST.md` and record
  the results there. Then read `src/game/TimelineController.ts`,
  `src/game/GameScene.ts`, `src/ui/controls.ts`, and `BUG_LOG.md` B3.
- **Acceptance:** the playtest checklist is filled in by a student, and
  `OWNERSHIP.md` records Siddharth's review honestly.

## T1 Akshay: onboard and review the game layer

- Follow `CLAUDE.md` (a new Claude Code session loads it automatically).
- Run `npm ci && npm test && npm run build && npm run demo:headless`, then
  play every scenario in the browser and compare against the table in
  README §Puzzle 001.
- Read `docs/architecture.md`, `src/game/`, `src/ui/`. Write down anything you
  can't explain and ask your agent or Siddharth.
- **Acceptance:** Akshay can explain how `TimelineController` turns a
  `SimulationResult` into what Phaser draws, and why the browser can't
  disagree with the headless simulation.

## T2 Akshay owns: Puzzle 002 + deterministic daily selection (Milestone 6)

This gives Akshay a component he designs himself, and it is the project's
stated long-term goal. Work **test-first**, as with Puzzle 001.

1. **Design (Akshay):** a second scenario on a new map, with three objects,
   at least one edit that saves the protagonist, and at least one that does
   not. Write `docs/puzzle-002-spec.md` with the graph, route lengths, signal
   cycles, and hand-derived tick tables, following `docs/puzzle-spec.md`.
2. **Failing tests first:** `tests/simulation/puzzle-002.test.ts` asserting
   the hand-derived chains. Commit while they fail (the puzzle JSON doesn't
   exist or is incomplete), and capture that output in `docs/evidence/`.
3. **Data:** `src/puzzles/puzzle-002.json`. Use the existing kinds
   (`traffic_light`, `obstacle`; actors `pedestrian`/`car`/`cyclist`) and
   existing map characters (see `src/game/sprites.ts`). **Do not change engine
   rules** (`PROJECT_SPEC.md`). If the design needs a new rule, record a
   decision and get Siddharth's approval first.
4. **Selection:** `src/puzzles/daily.ts` exporting
   `selectDailyPuzzle(catalog, date: Date)`, which returns
   `catalog[floor(date.getTime() / 86_400_000) mod catalog.length]` (UTC
   days; rollover at 00:00 UTC). No `Date.now()` inside: the caller passes
   the date. `tests/simulation/daily.test.ts`: same UTC day → same puzzle
   (e.g. 00:00:00Z and 23:59:59Z); next day → the next puzzle; the rotation
   repeats after `catalog.length` days.
5. **UI:** `src/main.ts` picks the puzzle with `selectDailyPuzzle(CATALOG, new
   Date())` and shows "Daily puzzle — YYYY-MM-DD (UTC)". Optional: a
   `?puzzle=puzzle-001` URL override for the demo. Rename `PUZZLE_001`-specific
   wording only where needed (e.g. `scripts/browser_smoke.py` assumes
   Puzzle 001's map, so it should force `?puzzle=puzzle-001`).
6. **Docs:** README and `docs/proposal-feedback.md` §5 updated from "planned"
   to what actually works; `PROJECT_SPEC.md` scope updated with Siddharth's
   approval.
- **Acceptance:** all tests pass, including new puzzle-002 and daily tests;
  the puzzle-002 tests failed before the data existed (evidence committed);
  the `sprites.test.ts` checks also pass for puzzle 002 (generalize the test
  to loop over the catalog).
- **Files:** `src/puzzles/`, `tests/simulation/`, `src/main.ts`,
  `tests/game/sprites.test.ts`, docs.

## T3 Both: presentation evidence

- Choose the two slide decisions (candidates ★ in `DECISIONS.md`: D4 and D5
  have measured evidence). Each student should be able to defend them.
- Fill in both EIDs and the contact email in `docs/proposal-feedback.md`.
- Decide whether B3 is the slide-5 debugging story, or record a better real one.
- Build the ~6-slide PDF from `COURSE_REQUIREMENTS.md` §Final presentation.
  Every claim must cite committed evidence; record the commit SHA shown on
  slide 1.
- Update `OWNERSHIP.md` with who reviewed and who owns what.

## T4 Polish (only if time remains)

- Small on-map labels "HOME" / "CAFE" (Phaser text at high resolution, or DOM
  overlay).
- Check the layout at laptop widths (1280, 1024) and below 900 px (the panel
  stacks under the canvas).
- After each UI change, run `npm test`, `npm run build`, and
  `uv run --with playwright python scripts/browser_smoke.py` with the dev
  server running.
