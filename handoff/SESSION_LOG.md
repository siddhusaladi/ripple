# Session Log (append-only)

## Session 1 — 2026-11-25 — Siddharth (Claude Code, Opus 5.5)

**Starting point:** `6c8ae8b` (GitHub initial commit: README + .gitignore), clean, in sync with origin.

**Work:**
- `16a2415` Scaffold: npm, TypeScript 5.9.3 (strict), Vite 8.3.8, Phaser 3.90.0,
  Vitest 5.1.2, tsx; placeholder boot scene; agent rules; external sources.
- `9dcdf7d` (tag `start`) Puzzle 001 topology and objects (JSON), simulation
  types, hand derivation (`docs/puzzle-spec.md`), simulation rules
  (`PROJECT_SPEC.md`), 14 scenario tests. Stub `runSimulation` → 14 failed.
- `f95b807` Engine: NavGraph/BFS, TrafficLight, MovableObstacle, Actor, World,
  Simulation. 14/14 scenario tests pass with unchanged expectations.
- `320aa3d` loadPuzzle validation, report/explanations, headless demo,
  determinism/reset/validation/headless/report tests → 35/35.
- Docs commit: evidence files, architecture, start comparison, proposal
  feedback, all handoff files.

**Decisions:** D1–D5 in `DECISIONS.md`. Notable: the +3 cyclist detour needs a
diagonal edge (grid parity), so the approved timing was kept (D2).

**Tests:** `npm test` 35/35 passing; `npm run build` passing; ran the D4
check (disable signals → 4 failures, restore → 35/35).

**Bugs:** B1 and B2 (harness/tooling, minor). No simulation-logic bug yet.

**Not pushed.** Stopped at the review checkpoint before Milestone 4 (frontend),
at Siddharth's request.

**Remaining:** NEXT_TASKS T1–T6.

## Session 2 — 2026-11-25 — Siddharth (Claude Code, Opus 5.5)

**Starting point:** `a73aab6`, clean, in sync with origin (session 1 and the
`start` tag had been pushed by Siddharth).

**Review (phase 1):** grepped the engine for instance ids and tick literals;
it references only kind/type names, never `trash_can` etc. or tick numbers.
D2 accepted: `NavGraph` treats the diagonal edge like any other (no geometry
special-casing), and BFS produces the +3.

**Work:**
- `0219c51` TimelineController: pure-TS playback of precomputed results, plus
  tests including browser pose = headless snapshot at every tick → 49 tests.
- `8f91747` Phaser GameScene, DOM controls, Kenney RPG Urban Pack 1.0 (CC0,
  license checked in the archive), art-vs-graph test, browser smoke script,
  and evidence screenshots → 52 tests.
- Handoff-docs commit: `CLAUDE.md`, `COURSE_REQUIREMENTS.md`, updated state,
  tasks, decisions (D4 mutation table, D5 evidence, D6, D7), B3, ownership,
  README onboarding.

**Tests:** `npm test` 52/52; `npm run build` OK; browser smoke test passed 3×
on dev and 1× on the production build. Mutation checks: M2 (no obstacle
blocking) → 9 failures; M3 (no collisions) → 6 failures; restored → 52/52.

**Bugs:** B3 (panel lagging clicks, found by the smoke test). The smoke
script also initially hid its own failure details; fixed.

**Browser:** the Claude-in-Chrome extension was not connected, so
verification used Playwright with the installed Chrome (headless).

**Not pushed.** Remaining: NEXT_TASKS T0–T4.

## Session 3 (2026-11-26, Siddharth) — re-verification after usage limit

**Starting point:** `a736354`, clean, in sync with `origin/main`. Session 2 had
already been pushed, though `CURRENT_STATE.md` said it hadn't.

**Checks:** `npm ci && npm test` → 52/52 in 8 test files; `npm run build` OK;
`scripts/browser_smoke.py` on the dev server → PASSED (all four outcomes match
headless; no console errors). Screenshots went to a temp dir; committed
evidence was left unchanged.

**Doc fixes:** `CURRENT_STATE.md` (push status, 8 test files, not 9), T0 in
`NEXT_TASKS.md` (push already done). Added `handoff/MANUAL_PLAYTEST.md` for
the student playtest.

**No code changes.** Next: T0 manual playtest, then decide on the
ownership split before starting T2.
