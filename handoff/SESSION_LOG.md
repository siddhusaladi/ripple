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
