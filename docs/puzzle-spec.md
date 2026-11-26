# Puzzle 001 "The Intersection" — Specification and Hand Derivation

Data: `src/puzzles/puzzle-001.json`. Rules: `handoff/PROJECT_SPEC.md`
§Simulation rules. Every number in `tests/simulation/scenarios.test.ts` comes
from this document, which was written **before** the simulation engine existed
(baseline tag `start`).

Node ids encode their tile: `s` sidewalk, `x` crosswalk, `r` road, `b` bike
path, `j` junction; `s10_7` is the sidewalk node at tile x=10, y=7.

## Map (24 × 13 tiles, decorative layer)

```text
          x: 0         1         2
             012345678901234567890123
        y=0  ############.tb..t...t..
        y=1  ############..b.....t...      b  bike path
        y=2  ############..bbbbbbbbb.      p  plaza path
        y=3  ############....b...b...      s  sidewalk
        y=4  HHHHHHH.....t....bbbb...      =  road (car drives east on y=9)
        y=5  HHHHHHH.pppp............      z  crosswalk
        y=6  HHHHdHH.p..p......t.....      H  Maya's house (d = door)
        y=7  ssssssssssssssssssssssss      C  cafe (d = door)
        y=8  ==============z=========
        y=9  ==============z=========
        y=10 ssssssssssssssssssssssss
        y=11 ################CdC#####
        y=12 ################CCC#####
```

## Navigation graph

| Network | Edges (chains) | Segments |
|---|---|---|
| foot | `s4_7 … s14_7` → `x14_8` → `x14_9` → `s14_10 … s17_10` | 16 |
| foot (plaza loop) | `s8_7` → `s8_6` → `s8_5` → `s9_5 … s11_5` → `s11_6` → `s11_7` | 7 (replaces 3) |
| car, one-way | `r2_9 … r13_9` → **[signal]** → `x14_9` → `r15_9 … r23_9` | 21 |
| bike | `b22_2 … b15_2` → `j14_2` → `b14_1` → `b14_0` | 10 |
| bike (park trail) | `b20_2` → `b20_3` → `b20_4` → `b19_4 … b17_4` → `b16_3` → `b16_2` | 7 (replaces 4) |

`x14_9` is the **crossing** landmark: the only node shared by the foot and car
networks. `j14_2` is the **side junction** landmark.

Each actor's shortest route is unique in every scenario below, so the BFS
tie-break rule never decides an outcome in Puzzle 001.

### Topology note: why the park trail has a diagonal edge

On a 4-connected grid every node alternates "parity" (x + y even/odd), so any
two paths between the same nodes differ by an **even** number of segments. The
pedestrian's +4 detour fits a grid, but the cyclist's required **+3** detour
cannot. The trail therefore includes one diagonal segment `b17_4 → b16_3`
(drawn as a curved trail). Without it the closest achievable values would have
been +2 or +4, which would have changed the approved side-junction tick (11).

## Actors

| Actor | Kind | Start | Destination | Default route |
|---|---|---|---|---|
| `pedestrian` (Maya, protagonist) | pedestrian | `s4_7` | `s17_10` (cafe) | 16 segments, crossing at segment 12 |
| `car` | car | `r2_9` | `r23_9` (leaves map) | 21 segments, crossing at segment 12 |
| `cyclist` | cyclist | `b22_2` | `b14_0` (leaves map) | 10 segments, side junction at segment 8 |

With one segment per tick and no waits, an actor reaches the node at route
index *k* at tick *k*.

## Editable objects

| Object | Default | Modification | Effect on world |
|---|---|---|---|
| `traffic_light` | cycle period 8, green 5, offset 0 | `retime`: offset 1 | controls car entry `r13_9 → x14_9` |
| `trash_can` | tile (10,6) — grass, no node | `move_to_sidewalk`: tile (10,7) | blocks `s10_7` |
| `delivery_crate` | tile (18,3) — grass, no node | `move_to_bike_path`: tile (18,2) | blocks `b18_2` |

Signal schedule (green iff `(t + offset) mod 8 < 5`):

| tick | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|---|---|---|---|---|---|---|
| default (offset 0) | G | G | **G** | R | R | R | G |
| retimed (offset 1) | G | G | **R** | R | R | **G** | G |

The car only uses the signalled edge when moving from `r13_9` (reached at
tick 11) into the crossing, first attempted at tick 12.

## Scenario 0 — no intervention

| tick | pedestrian | car | cyclist |
|---|---|---|---|
| 0 | `s4_7` | `r2_9` | `b22_2` |
| 8 | `s12_7` | `r10_9` | `j14_2` (side junction) |
| 10 | `s14_7` | `r12_9` | `b14_0` arrived |
| 11 | `x14_8` | `r13_9` | — |
| 12 | `x14_9` crossing | `x14_9` crossing (green) | — |

Tick 12: both actors entered `x14_9` → collision; the car is a vehicle, so the
pedestrian dies and the car is crashed. No actor remains active → run ends.

**Expected:** collision at `x14_9` at tick 12, pedestrian dies at 12, failure
(`killed`), end tick 12. No `route_changed` events.

## Scenario 1 — traffic light retimed

- Tick 0: `object_modified traffic_light/retime`. Routes unchanged (signals do
  not affect route planning).
- Pedestrian: crossing at 12, `s14_10` at 13, arrives at cafe `s17_10` at 16.
- Car: `r13_9` at 11. Ticks 12, 13, 14 are red → waits three times at `r13_9`.
  Tick 15 green → enters crossing at 15. Remaining 9 segments → arrives
  `r23_9` at 24.
- At tick 15 the pedestrian is at `s16_10`; no shared node at any tick.
- Cyclist as in Scenario 0 (arrives at 10).

**Expected:** car `waited_at_signal` at 12, 13, 14; car enters crossing at 15;
pedestrian enters crossing at 12 and is on `s14_10` at 13; no collision;
pedestrian arrives at 16; success; end tick 24.

## Scenario 2 — trash can pushed onto the sidewalk

- Tick 0: `object_modified`; `s10_7` blocked. Pedestrian BFS route avoids it
  via the plaza loop: `s8_7 → s8_6 → s8_5 → s9_5 → s10_5 → s11_5 → s11_6 →
  s11_7` (7 segments instead of `s8_7 → s9_7 → s10_7 → s11_7`, 3 segments).
  Total 20 segments vs 16 → `route_changed` 16 → 20 (+4).
- Pedestrian reaches crossing at route index 12 + 4 = **16**, arrives at cafe
  at 20.
- Car unchanged: crossing at 12, `r15_9` at 13, … , at 16 the car is on
  `r18_9`. Arrives `r23_9` at 21.
- No shared node at any tick.

**Expected:** pedestrian route excludes `s10_7`, 20 segments; one
`route_changed` (pedestrian, 16 → 20); car enters crossing at 12; pedestrian
enters crossing at 16; no collision; pedestrian arrives at 20; success; end
tick 21.

## Scenario 3 — delivery crate dragged into the bike path

- Tick 0: `object_modified`; `b18_2` blocked. Cyclist BFS route takes the park
  trail: `b20_2 → b20_3 → b20_4 → b19_4 → b18_4 → b17_4 → b16_3 → b16_2`
  (7 segments instead of 4). Total 13 vs 10 → `route_changed` 10 → 13 (+3).
- Cyclist reaches side junction at index 8 + 3 = **11**, arrives at 13.
- Pedestrian and car routes unchanged → same collision as Scenario 0 at 12.
- Cyclist is still active after the crash, so the run ends at 13.

**Expected:** one `route_changed` (cyclist, 10 → 13); cyclist enters side
junction at 11; collision at `x14_9` at 12; pedestrian dies at 12; failure;
end tick 13.

This scenario is deliberate: a visible change in the world (the cyclist's
detour) that does not touch the causal chain of the accident.
