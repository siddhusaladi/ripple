# Current State

_Updated at the end of session 1 (2026-11-25). Last code commit: `320aa3d`;
this file is part of the docs commit that follows it (`git log -1`)._

## Works (verified)

- `npm ci`, `npm run build` (typecheck + Vite build), and `npm run dev` (serves
  the placeholder Phaser boot scene).
- Headless simulation of Puzzle 001: graph routing, traffic-light cycle,
  obstacles blocking nodes, collisions, deaths, arrivals, completion,
  per-tick snapshots, event log.
- All four scenarios produce the hand-derived chains (`docs/puzzle-spec.md`).
- Puzzle validation (`loadPuzzle`) and intervention validation.
- Event-derived explanations (`src/simulation/report.ts`).
- `npm run demo:headless [-- none|traffic_light|trash_can|delivery_crate]`.
- `npm test`: **35 passed / 35** across 6 files (scenarios, determinism, reset,
  validation, headless, report).
- Baseline tag `start` → `9dcdf7d`: 14/14 scenario tests fail (evidence in
  `docs/evidence/`).

## Not built yet

- **The playable game.** The browser still shows only the "RIPPLE / simulation
  not implemented yet" boot scene. Missing: `TimelineController`, `GameScene`
  rendering, object selection, Play/Rewind/Replay, timeline bar,
  result/explanation panel.
- Art assets (Kenney RPG Urban Kit not downloaded; nothing in `public/assets/`).
- Daily puzzle system (planned only).
- Student EIDs and emails (`docs/proposal-feedback.md` placeholders).

## Known limitations of the current engine

See README §Known limitations.

## Blocking problems

None. Nothing has been pushed to GitHub yet; Siddharth must review and push
before Akshay can pull.
