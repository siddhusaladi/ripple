# RIPPLE — instructions for coding agents

RIPPLE is a CS 378 (UT Austin) final project by Siddharth Saladi and Akshay
Kondala: a browser pixel-art puzzle where a deterministic, headless TypeScript
simulation decides whether one environmental edit prevents an accident.
Phaser only draws it. Due **Tuesday, December 1, 2026, 3:00 PM**.

The repository is the only shared memory between sessions. You have no access
to earlier conversations. Everything you need is in these files.

## Before doing anything

1. `git status` and `git fetch`. If the tree is dirty, stop and ask. If
   behind, run `git pull --ff-only`.
2. Read, in order:
   - `handoff/CURRENT_STATE.md`: what works, what doesn't, risks
   - `handoff/NEXT_TASKS.md`: the next task and its acceptance criteria
   - `handoff/COURSE_REQUIREMENTS.md`: what the assignment grades, and the evidence for each item
   - `handoff/PROJECT_SPEC.md`: approved rules. **Do not change them without student approval**
   - `handoff/DECISIONS.md` and `handoff/BUG_LOG.md`
   - `docs/architecture.md`, then the source files the task touches
3. `npm ci && npm test && npm run build`, then compare against
   `CURRENT_STATE.md`. Report any mismatch first.
4. Tell the student which task you will do, then do it.

## Rules

@handoff/AGENT_RULES.md
