# Course Requirements → Status and Evidence

What the CS 378 final project is graded on, and where the proof lives. The
instructor evaluates **the software we designed, the decisions we made, and the
evidence we can show**. Keep this table current. Every cited file must be
committed (`git ls-files --error-unmatch PATH`).

Status: ✅ done and evidenced · 🟡 partial · ❌ missing

## A. Meaningful original software (2–3 components; each student owns one)

| Item | Status | Evidence / gap |
|---|---|---|
| Component 1: deterministic simulation engine (routing, signals, obstacles, collisions, tick order) | ✅ | `src/simulation/`, `docs/puzzle-spec.md`, `tests/simulation/` |
| Component 2: game layer (timeline playback, Phaser scene, controls, explanations) | ✅ | `src/game/`, `src/ui/`, `src/simulation/report.ts`, `tests/game/` |
| Component 3 (optional): puzzle data model and validation; daily selection planned | 🟡 | `src/puzzles/loadPuzzle.ts`; daily selection not built |
| **Each student owns and can explain a component** | ❌ **risk** | All code so far was written by the agent in Siddharth's sessions. Akshay has no contributions yet. See `OWNERSHIP.md` and NEXT_TASKS T1 |

## B. Starting point

| Item | Status | Evidence |
|---|---|---|
| Identifiable starting commit | ✅ | tag `start` → `9dcdf7d` (pushed to GitHub) |
| External code/libraries/assets documented | ✅ | `docs/external-sources.md` |
| Record of what we added | ✅ | `docs/start-comparison.md`, `git log start..` |
| Capability the start could not handle | ✅ | simulate Puzzle 001's chains (`docs/start-comparison.md`) |
| Check that fails at start, passes now | ✅ | `npm test -- tests/simulation/scenarios.test.ts`: `docs/evidence/start-baseline-npm-test.txt` (14 failed, exit 1), `docs/evidence/scenarios-passing-npm-test.txt` (pass, exit 0) |

## C. Two engineering decisions (problem, approach, alternative, rationale, agent's task, code, measurement, result, follow-up)

| Item | Status | Evidence |
|---|---|---|
| Decision 1 | 🟡 students choose | Candidates with full records: **D4** (event-chain tests + mutation checks, measured), **D5** (headless simulation + snapshot playback, measured), **D1** (fixed ticks + BFS). All in `DECISIONS.md` |
| Decision 2 | 🟡 students choose | As above. The students must confirm the decisions are theirs and can defend them |

## D. One genuine debugging story

| Item | Status | Evidence |
|---|---|---|
| Real bug with symptom, investigation, cause, fix, verification, agent role | 🟡 | **B3** in `BUG_LOG.md`: panel lagging clicks, found by the browser smoke test, with a hypothesis that was partly wrong. Modest but real and reproducible. No simulation bug has occurred |

## E. A specific limitation

| Item | Status | Evidence |
|---|---|---|
| Unsupported case that really applies | ✅ | README §Known limitations (one edit per replay; routes fixed at tick 0; edge-swap collisions undetected) |
| What tests don't establish | ✅ | `DECISIONS.md` D4: determinism and UI-consistency tests pass even with broken rules |
| How we'd extend | ✅ | `PROJECT_SPEC.md` §Planned extensions |

## F. Reproducibility

| Item | Status | Evidence |
|---|---|---|
| Node version, install, dev, build, test commands | ✅ | `README.md` |
| Reproduce original failure / successful intervention | ✅ | `npm run demo:headless -- none` / `-- trash_can`; in browser via `npm run dev` |
| Headless simulation command | ✅ | `npm run demo:headless` |
| No paid APIs, credentials, or external services | ✅ | none used; assets committed locally |
| Evidence files committed | ✅ | `docs/evidence/` |

## Final presentation (~6 slides, PDF; important claims must be on the slides)

| Slide | Ready? | Source material |
|---|---|---|
| 1 What we built: names, **both UT EIDs**, repo URL, commit SHA, audience, demo | 🟡 | EIDs missing (`docs/proposal-feedback.md` TODO); screenshots in `docs/evidence/screenshots/` |
| 2 Contributions: starting code, libraries + versions, own components, agent role, each student's work, fail→pass check | 🟡 | `docs/external-sources.md`, `docs/start-comparison.md`, `OWNERSHIP.md`. Akshay's part missing |
| 3 Decision 1 | 🟡 | `DECISIONS.md` |
| 4 Decision 2 | 🟡 | `DECISIONS.md` |
| 5 Debugging story | 🟡 | `BUG_LOG.md` B3 |
| 6 Limitations | ✅ | README, D4 |

## Proposal feedback (instructor's six points)

All six are addressed in `docs/proposal-feedback.md`, except that the
student EIDs and contact email are still placeholders.

## Not allowed

No CS 378 homework code, tests, or handouts. No fabricated evidence,
backdated commits, or hidden agent use. Do not move the `start` tag.
