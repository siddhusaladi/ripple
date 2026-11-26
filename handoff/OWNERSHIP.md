# Ownership

Contributions are credited to the student who ran the session; agent-written
code is labeled as agent-assisted. A student **owns** a component only when
they directed it, reviewed it, and can explain it. Review status is recorded
honestly. Do not mark a review done on a student's behalf.

## Components

| Component | Files | Proposed owner | Written by | Student review |
|---|---|---|---|---|
| Puzzle 001 spec and simulation rules | `docs/puzzle-spec.md`, `handoff/PROJECT_SPEC.md` | Siddharth | Scenario expectations: Siddharth (project prompt). Topology and derivation: agent, session 1 | ❌ pending |
| Simulation engine | `src/simulation/`, `src/puzzles/loadPuzzle.ts` | Siddharth | agent, session 1 | ❌ pending |
| Game layer: playback, Phaser scene, controls | `src/game/`, `src/ui/`, `src/main.ts` | **undecided**. Was planned for Akshay, but the agent built it in Siddharth's session 2 at Siddharth's request | agent, session 2 | ❌ pending |
| Puzzle 002 + daily selection | (not yet written) | Akshay (proposed, NEXT_TASKS T2) | — | — |
| Assets integration, evidence, presentation | `docs/`, `public/assets/` | shared | agent, sessions 1–2 | ❌ pending |

**Open issue:** the course requires each student to own at least one
meaningful component. At present Akshay has written nothing. T2 is the
proposed fix; the students should confirm the split.

## By session

| Session | Student | Student's own work | Agent assistance |
|---|---|---|---|
| 1 (2026-11-25) | Siddharth | Wrote the project specification: concept, four scenarios and their timings, rules, rejection criteria. Ran the session; asked for a review checkpoint | Claude Code: scaffold, topology, derivation, engine, tests, demo, docs |
| 2 (2026-11-25) | Siddharth | Directed the frontend scope; provisionally approved D2 (diagonal trail) | Claude Code: review of session 1, TimelineController, GameScene, controls, asset integration, browser smoke test, mutation checks, B3 fix, handoff audit (`CLAUDE.md`, `COURSE_REQUIREMENTS.md`) |
