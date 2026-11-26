# Bug Log

Real problems only, newest last. No simulation-logic bug has occurred: the
engine passed the pre-written scenario tests on its first run (`f95b807`).
B3 is the most substantial real bug so far and could serve as the slide 5
debugging story. If a better one comes up, record it in full.

---

## B1 Baseline failures reported as "skipped" instead of "failed" (test harness) — fixed

- **Symptom:** at the baseline, `npm test` printed `Tests 14 skipped (14)`
  and the file failed, which reads as if nothing had been tested.
- **Reproduction:** run `runSimulation` inside `beforeAll` while it throws.
- **Investigation:** the error was thrown once, in the hook; Vitest marks the
  tests in a describe block whose `beforeAll` throws as skipped.
- **Cause:** test structure, not the simulation.
- **Fix:** a `memo()` helper runs the simulation lazily inside each test, so
  each test fails on its own (`tests/simulation/helpers.ts`). This was fixed
  before the `start` commit `9dcdf7d`, which is why the baseline evidence
  shows `14 failed`.
- **Verification:** `docs/evidence/start-baseline-npm-test.txt`.
- **Agent role:** the agent noticed the output and made the change; Siddharth
  has not yet reviewed it.

## B2 Exit code missing from the first baseline evidence capture (tooling) — fixed

- **Symptom:** the captured baseline output ended with `exit code: ` (empty).
- **Cause:** the capture used bash's `PIPESTATUS`, but the shell was zsh.
- **Fix:** capture `$?` from an unpiped `npm test` run. The committed
  evidence shows `1`.

## B3 Control panel lagged behind clicks; browser smoke test failed (UI) — fixed

- **Symptom:** the first full run of `scripts/browser_smoke.py` (session 2)
  reported `FAILED: 2 mismatches` without saying what they were. After the
  script was changed to print them: `canvas click did not select the trash
  can: []` and `reset did not clear the selection`. Yet the trash-can replay
  in that same run succeeded, so the selection *had* reached the simulation.
- **Reproduction:** the buggy version was never committed; the bug was found
  and fixed before `8f91747`. To reproduce, delete the `this.render();` line in
  `Controls.command()`, run `npm run dev`, then run the smoke script. It
  reports the same 2 mismatches. Manually: click Reset and read
  `.object.selected` in the DOM synchronously; the old selection is still
  marked.
- **Investigation:**
  1. The script hid the failure details (a bug in the script itself); fixed
     it to print every mismatch.
  2. Both failing checks read the DOM immediately after an input. The
     simulation state was correct, so the stale part was the view.
  3. `Controls.render()` was only called from `GameScene.update()` through
     the `onFrame` hook, so the panel refreshed on Phaser's next animation
     frame, not when the player acted.
  4. Hypothesis test: render immediately after each panel command, with the
     smoke script unchanged. Predicted: Reset passes, but the canvas click
     still fails, because Phaser input is handled on its frame. **Actual:
     both passed.** The prediction was wrong for the canvas: Phaser 3.90
     dispatches pointer events synchronously from the DOM event, so
     `selectFromScene` had already run inside the click.
- **Cause:** the panel only refreshed from the render loop. This was harmless
  at 60 fps, but stale for one frame and indefinitely in a background tab,
  where `requestAnimationFrame` is paused.
- **Fix:** `Controls.command()` runs each player command and then calls
  `render()` immediately (`src/ui/controls.ts`), in commit `8f91747`.
- **Verification:** `scripts/browser_smoke.py` passed 3 consecutive runs on the
  dev server and once on the production build
  (`docs/evidence/browser-smoke-output.txt`).
- **Agent role:** the agent wrote the smoke script, found and fixed the
  script's silent-failure bug, formed and tested the hypothesis, and
  implemented the fix. **Student review pending.**
