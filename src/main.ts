import Phaser from "phaser";

// Milestone 0 placeholder: proves Vite + Phaser boot. Replaced by the real game in Milestone 4.
class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.add
      .text(384, 200, "RIPPLE", { fontFamily: "monospace", fontSize: "48px", color: "#f4e8c1" })
      .setOrigin(0.5);
    this.add
      .text(384, 260, "simulation not implemented yet", { fontFamily: "monospace", fontSize: "16px", color: "#9aa5b1" })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 768,
  height: 416,
  backgroundColor: "#1d2430",
  pixelArt: true,
  scene: [BootScene],
});
