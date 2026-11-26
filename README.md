# RIPPLE

A browser-based pixel-art puzzle game about the butterfly effect. Maya walks to
a cafe and is hit by a car at an intersection. Rewind, change one object in the
neighborhood, and replay a deterministic simulation to see whether the chain
reaction saves her.

CS 378 final project: Siddharth Saladi and Akshay Kondala.
Repository: https://github.com/siddhusaladi/ripple

> **Status:** playable MVP: one puzzle, three editable objects, full
> rewind/replay loop, all outcomes computed by a tested headless simulation.
> Daily puzzles are planned, not built. Details: `handoff/CURRENT_STATE.md`.

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
npm run preview           # serve the production build from dist/ (after npm run build)
```

No configuration, environment variables, or network access needed after
`npm ci`.

Optional browser check (needs Google Chrome and [uv](https://docs.astral.sh/uv/);
run while `npm run dev` is running):

```bash
uv run --with playwright python scripts/browser_smoke.py http://localhost:5173/
```

It plays all four scenarios in headless Chrome and fails if any outcome
differs from the headless simulation or the console shows errors.

## How to play

1. Open the dev server URL and press **Play**: Maya leaves home and is hit at
   the crossing.
2. Pick one object, either with its button in the panel or by clicking it in
   the scene (yellow outline): the traffic light, the trash can, or the
   delivery crate.
3. Press **Replay** and watch the chain reaction. The result panel explains
   what changed, using the simulation's own events.
4. **Rewind** keeps your change and returns to the start; **Reset** removes
   it. Space plays and pauses; R rewinds.

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
  `tick 12: COLLISION at x14_9` and `FAILED (killed)`. In the browser, press
  Play without choosing anything.
- **Successful intervention:** `npm run demo:headless -- trash_can` (or
  `traffic_light`) ends with `SURVIVED`. In the browser, choose the trash can
  and press Replay.
- **Failed intervention:** `npm run demo:headless -- delivery_crate`. The
  cyclist reroutes, but Maya still dies at tick 12.
- **Starting point vs. now:** the scenario tests fail on tag `start` and pass
  now. See `docs/start-comparison.md` for the exact commands and the captured
  output in `docs/evidence/`.

## Project layout

```text
src/simulation/   headless engine (no Phaser/DOM): NavGraph, objects, Actor, World, Simulation, report
src/puzzles/      puzzle JSON + loadPuzzle validator
src/game/         TimelineController (pure TS playback), GameScene (Phaser), sprite map
src/ui/           DOM control panel + styles
src/main.ts       browser entry
public/assets/    Kenney RPG Urban Pack tile sheet + license (CC0)
scripts/          demo-headless.ts, browser_smoke.py (optional)
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
- The tests that compare runs (determinism, browser vs. headless) show
  consistency, not correctness. They passed even with core rules
  deliberately broken; correctness rests on the hand-derived scenario tests
  (`handoff/DECISIONS.md` D4).
- Layout has been checked at desktop size (1400 × 860) only.

## Resuming development (new developer or new Claude Code session)

The repository is the only shared memory; no earlier conversation is needed.

1. `git pull --ff-only`, then `npm ci`.
2. Start Claude Code in the repo root. It loads `CLAUDE.md`, which lists the
   handoff files to read in order and points to `handoff/AGENT_RULES.md`
   (rules, rejection criteria, session-end checklist).
3. Read `handoff/CURRENT_STATE.md` (what works now) and
   `handoff/NEXT_TASKS.md` (what to do next, with acceptance criteria).
   `handoff/COURSE_REQUIREMENTS.md` maps each grading requirement to its
   evidence.
4. Run `npm test && npm run build` and confirm they match `CURRENT_STATE.md`
   before changing anything.
5. At the end of the session, update `CURRENT_STATE.md` and `NEXT_TASKS.md`,
   append to `SESSION_LOG.md`, commit, and push only when the student asks.

## Credits

Art: Kenney RPG Urban Pack (CC0). Libraries and versions: `docs/external-sources.md`. Built with
substantial help from Claude Code. See `handoff/OWNERSHIP.md`.
