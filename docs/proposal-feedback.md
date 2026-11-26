# Response to Proposal Feedback

## 1. Exact chain reactions (Puzzle 001)

Full tick-by-tick derivation: `docs/puzzle-spec.md`.

| Object | What changes | What happens | When | Survives? |
|---|---|---|---|---|
| (none) | — | Maya and the car both enter the crossing | tick 12 collision | **No**, dies at 12 |
| Traffic light | cycle offset 0 → 1 (red one second earlier) | car is held at the stop line, Maya crosses first | car waits 12–14, enters crossing at 15; Maya crosses at 12 | **Yes**, at cafe at 16 |
| Trash can | moved onto sidewalk tile (10,7) | Maya's sidewalk is blocked; BFS picks the plaza loop, +4 segments | car crosses at 12; Maya crosses at 16 | **Yes**, at cafe at 20 |
| Delivery crate | moved onto bike path tile (18,2) | cyclist reroutes along the park trail, +3 segments | cyclist at side junction at 11 instead of 8; collision still at 12 | **No**, dies at 12 |

## 2. Deterministic tests

`tests/simulation/scenarios.test.ts` checks each chain (routes, waits,
landmark ticks, collisions, deaths, outcome) in plain Node, without Phaser.
`determinism.test.ts` repeats each scenario 25 times and requires identical
results. Run with `npm test`; the scenarios can also be printed with
`npm run demo:headless`.

## 3. Agent rejection criteria

We reject generated code that hardcodes outcomes or event ticks per object,
changes simulation rules or test expectations without a recorded decision,
couples simulation logic to Phaser, adds nondeterminism, or fabricates
evidence. Full list: `handoff/AGENT_RULES.md` §Rejection criteria.

## 4. Pixel-art assets

Intended pack: **Kenney RPG Urban Kit** (https://kenney-assets.itch.io/rpg-urban-kit),
license **CC0 1.0**. *Status: not yet included in the repository.* The
license will be verified at download time and recorded in
`docs/external-sources.md`. If the pack cannot be obtained, the game uses
simple generated shapes. The rendering layer is separate from the simulation,
so swapping art does not affect rules or tests.

## 5. Meaning of "daily puzzles"

*Planned, not implemented.* The MVP ships one puzzle. The planned design:
a curated catalog of hand-authored puzzle JSON files, each validated by
`loadPuzzle` and covered by its own scenario tests. The puzzle for a date is
`catalog[daysSinceUnixEpoch(dateUTC) mod catalog.length]`, so everyone gets
the same puzzle on the same UTC calendar day, with rollover at 00:00 UTC. The
date is a function argument, which makes selection testable. The catalog
repeats in that fixed rotation; we do not claim unlimited unique puzzles, and
no AI or external service generates them.

## 6. Student information

| Name | UT EID | Contact email |
|---|---|---|
| Siddharth Saladi | `TODO-EID` | `TODO-EMAIL` |
| Akshay Kondala | `TODO-EID` | `TODO-EMAIL` |

> **TODO (students):** fill in both EIDs and a contact email. These must also
> appear on the final slide deck.
