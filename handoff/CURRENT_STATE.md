# Current State

_Updated at the end of session 2 (2026-11-25, Siddharth). Verify with
`git log --oneline -12`. Last code commit: `8f91747`; the handoff-docs commit
follows it._

## Works (verified this session)

- **Playable MVP in the browser** (`npm run dev`). The player watches the
  accident, rewinds, picks one of three objects (panel button or click in the
  scene), replays, and gets a success or failure banner with an
  event-derived explanation. Also: pause/resume, Reset, 1× / 2.5× speed, a
  timeline with crash/wait/arrival markers, attempt history, and a player
  event log.
- Art: Kenney RPG Urban Pack (CC0), committed under `public/assets/`.
- Headless simulation of Puzzle 001, with all four scenarios matching
  `docs/puzzle-spec.md`. `npm run demo:headless` prints the real event logs.
- `npm test`: **52 passed / 52** in 9 files: scenarios, determinism, reset,
  validation, headless, report, timeline (incl. browser-pose = headless
  snapshot at every tick), sprites (art agrees with the graph).
- `npm run build`: passes. The production build also passes the browser smoke
  test.
- `scripts/browser_smoke.py` (optional, needs Google Chrome + `uv`): plays all
  four scenarios in headless Chrome. Outcomes and end ticks match the headless
  demo, with no console errors. It passed 3× on the dev server and 1× on the
  production build (`docs/evidence/browser-smoke-output.txt`, screenshots in
  `docs/evidence/screenshots/`).
- Baseline tag `start` (`9dcdf7d`) is on GitHub; the scenario tests fail
  there (14/14).

## Incomplete

- **Student ownership:** every line so far was written by the agent during
  Siddharth's sessions. Akshay has no contributions yet, and neither student
  has reviewed session 2's code. This is the top grading risk (see
  `COURSE_REQUIREMENTS.md` §A).
- Slide decisions not yet chosen by the students; the slide deck isn't started.
- Student EIDs and contact email are placeholders (`docs/proposal-feedback.md`).
- Daily puzzle system: planned only (one puzzle exists).
- Polish not done: no on-map labels for "home"/"cafe"; layout tested only at
  1400 × 860 desktop.

## Broken

Nothing known.

## Risks

- Ownership (above).
- The debugging story (B3) is real but modest; no simulation bug has occurred.
- Consistency tests ≠ correctness tests (DECISIONS D4). Correctness depends on
  the hand-derived expectations in `docs/puzzle-spec.md`.
- Session 2 commits are **not pushed**. Akshay cannot see them until
  Siddharth pushes.

## Known limitations

README §Known limitations.
