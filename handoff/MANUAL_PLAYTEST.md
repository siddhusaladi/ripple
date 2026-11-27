# Manual Playtest Checklist

`scripts/browser_smoke.py` checks the outcomes automatically (it passed again
in session 3). This checklist covers what an automated check can't judge:
whether a person can see and follow what happens. **Only a student fills in
the results.** An agent must not tick these boxes.

Setup: `npm ci && npm run dev`, then open http://localhost:5173/ in Chrome.
Keep DevTools → Console open.

Expected values come from README §Puzzle 001 / `docs/puzzle-spec.md`.

| # | Do this | Expect | Pass? | Tester / date / notes |
|---|---|---|---|---|
| 1 | Load the page, let the first run play | Maya and the car collide in the crossing at t=12; failure banner; "No change" ✘ in attempts | | |
| 2 | Rewind, pick **Traffic light** (button or click in scene), replay | Car waits at red t=12–14, enters at 15; Maya safe at 16; success banner | | |
| 3 | Rewind, pick **Trash can** | Maya visibly takes the longer route (+4), crosses at 16 after the car; safe at 20 | | |
| 4 | Rewind, pick **Delivery crate** | Cyclist visibly detours (+3), reaches side junction at 11 not 8; Maya still hit at 12 | | |
| 5 | During any run: pause / resume, switch 1× ↔ 2.5× | Playback pauses/resumes and changes speed; the outcome does not change | | |
| 6 | Drag/click the timeline to scrub back and forth | Sprites jump to matching positions; markers line up with the events | | |
| 7 | Press **Reset** (undo your change and rewind) | Scene returns to the original layout; next replay shows the accident again | | |
| 8 | Repeat any scenario twice | Identical result and ticks both times | | |
| 9 | Check the explanation text and event log after each run | Text matches what you saw on screen | | |
| 10 | Watch the console throughout | No errors | | |
| 11 | Resize the window to ~1280 and ~1024 wide | Layout is still usable (only 1400×860 has been checked so far) | | |

Anything that fails: log it in `BUG_LOG.md` (symptom, reproduction, then
investigation).
