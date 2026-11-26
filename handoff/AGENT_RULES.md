# Agent Rules

Rules for every coding-agent session on RIPPLE (Siddharth's and Akshay's Claude
Code sessions alike). The repository is the only shared memory between sessions:
if something matters, it must be written down here or in the other handoff files.

## Session start (in order)

1. `git status`, `git fetch`, `git log --oneline -15`. If local is behind
   `origin/main`, `git pull --ff-only` **before editing**. Never discard
   uncommitted work; if the tree is dirty, stop and ask the student.
2. Read `README.md`, `handoff/PROJECT_SPEC.md`, `handoff/CURRENT_STATE.md`,
   `handoff/NEXT_TASKS.md`, `handoff/DECISIONS.md`, `handoff/BUG_LOG.md`.
3. `npm ci && npm test && npm run build`. Compare with what `CURRENT_STATE.md`
   claims. Report any mismatch before doing new work.
4. Pick the highest-priority unfinished task in `NEXT_TASKS.md`.

## During the session

- Work in small milestones; run `npm test` (and `npm run build` for UI work)
  after each, and commit verified work with an accurate message.
- Respect recorded decisions. To change one, write the new decision in
  `DECISIONS.md` and get the student's approval first.
- Do not make unrelated rewrites of working code.
- If you hit a real bug, log it in `BUG_LOG.md` as you investigate (symptom,
  reproduction, investigation, cause, fix, verifying test, commit).

## Rejection criteria — never write, and flag if found

1. Survival/death decided by *which* object was edited
   (e.g. `if (edit === "trashCan") return { survived: true }`).
2. Hardcoded event ticks (deaths, arrivals, crossings) instead of ticks that
   come from actors moving through the graph.
3. Changes to simulation rules (`handoff/PROJECT_SPEC.md` §Simulation rules)
   without a recorded, student-approved decision.
4. Changing expected test values to make failing code pass. Expectations come
   from `docs/puzzle-spec.md`; if one is wrong, stop, document the reasoning,
   and propose a spec correction to the student.
5. Claiming tests pass without running them, or skipping tests.
6. Nondeterminism: `Math.random`, `Date.now`, wall-clock or frame-time inside
   `src/simulation/` or `src/puzzles/`. (Frame time is allowed only for visual
   interpolation in `src/game/`.)
7. Simulation logic in Phaser code. `src/simulation/` and `src/puzzles/` must
   never import `phaser` or touch `window`/`document` (enforced by
   `tests/simulation/headless.test.ts`).
8. Unnecessary libraries or frameworks (no React, servers, databases).
9. External assets/code without an entry in `docs/external-sources.md`.
10. Silently removing required functionality or handoff records.
11. Fabricated evidence: test output, bugs, benchmarks, commits, or student
    contributions. Evidence files in `docs/evidence/` must be real command output.
12. Secrets or credentials in Git.
13. Describing placeholders as finished features.

## Git

- Sequential workflow on `main`; short-lived branch for risky changes.
- No force-push, no history rewriting, no backdating, no moving the `start` tag.
- Do not hide agent use: commits made with an agent carry a `Co-Authored-By`
  trailer for the agent.
- Push only when the student running the session asks for it.
- Anything cited as evidence must be committed:
  `git ls-files --error-unmatch PATH`.

## Session end

Update `CURRENT_STATE.md`, `NEXT_TASKS.md`, append to `SESSION_LOG.md`, record
decisions/bugs, update `OWNERSHIP.md` honestly (agent-written code is credited
as agent-assisted in the session of the student who ran it), commit, and report
the commit SHA, test results, and whether the work was pushed.
