# Bug Log

Real problems only. No simulation-logic bug has occurred yet: the engine
passed the pre-written scenario tests on its first run (`f95b807`). The
project still needs a genuine debugging story for the slides. Record the
next real one in full.

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
