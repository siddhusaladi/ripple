// Browser entry: wires the headless simulation (via TimelineController) to Phaser and the DOM.
import Phaser from "phaser";
import { GameScene } from "./game/GameScene";
import { TILE } from "./game/sprites";
import { TimelineController } from "./game/TimelineController";
import { PUZZLE_001 } from "./puzzles";
import { Controls } from "./ui/controls";
import "./ui/style.css";

const puzzle = PUZZLE_001;
const timeline = new TimelineController(puzzle);

// Size the stage to the map so the canvas fills it without letterboxing.
document.querySelector<HTMLElement>("#stage")!.style.aspectRatio = `${puzzle.map[0]!.length} / ${puzzle.map.length}`;
document.querySelector<HTMLElement>("#title")!.textContent = `Puzzle ${puzzle.id.replace("puzzle-", "")}: ${puzzle.title}`;

let scene: GameScene | null = null;
const controls = new Controls(document.querySelector<HTMLElement>("#panel")!, timeline, {
  onObjectHover: (id) => scene?.setHovered(id),
});

scene = new GameScene(timeline, {
  onObjectClicked: (id) => controls.selectFromScene(id),
  onObjectHover: (id) => {
    scene?.setHovered(id);
    controls.highlight(id);
  },
  onFrame: () => controls.render(),
});

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "stage",
  width: puzzle.map[0]!.length * TILE,
  height: puzzle.map.length * TILE,
  backgroundColor: "#1d2430",
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: [scene],
});
