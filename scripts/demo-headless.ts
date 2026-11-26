// Headless demo: runs Puzzle 001 scenarios through the real simulation in Node and prints
// the event log and explanation. No Phaser, no browser.
//
//   npm run demo:headless                 # all four scenarios
//   npm run demo:headless -- trash_can    # one scenario: none | traffic_light | trash_can | delivery_crate
import { runSimulation, type Intervention } from "../src/simulation";
import { explainRun, formatEvent } from "../src/simulation/report";
import { PUZZLE_001 } from "../src/puzzles";

const puzzle = PUZZLE_001;
const scenarios: Array<{ name: string; intervention: Intervention | null }> = [
  { name: "none", intervention: null },
  ...puzzle.objects.map((o) => ({ name: o.id, intervention: { objectId: o.id, modificationId: o.modifications[0]!.id } })),
];

const wanted = process.argv.slice(2);
const unknown = wanted.filter((w) => !scenarios.some((s) => s.name === w));
if (unknown.length > 0) {
  console.error(`Unknown scenario(s): ${unknown.join(", ")}. Choose from: ${scenarios.map((s) => s.name).join(", ")}`);
  process.exit(2);
}

const baseline = runSimulation(puzzle, null);
for (const s of scenarios.filter((s) => wanted.length === 0 || wanted.includes(s.name))) {
  const result = s.intervention ? runSimulation(puzzle, s.intervention) : baseline;
  const edit = s.intervention ? `${s.intervention.objectId}/${s.intervention.modificationId}` : "no intervention";
  console.log(`\n=== ${puzzle.id} "${puzzle.title}" — ${edit} ===`);
  for (const e of result.events) console.log("  " + formatEvent(puzzle, e));
  console.log(`  result: ${result.success ? "survived" : "died"} (end tick ${result.endTick})`);
  console.log("  explanation:");
  for (const line of explainRun(puzzle, result, baseline)) console.log("    - " + line);
}
