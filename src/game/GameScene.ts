// Phaser rendering of a TimelineController. This scene draws state; it never computes it.
// Positions, statuses, signal colors, and object placement all come from the controller,
// which in turn reads precomputed simulation snapshots.
import Phaser from "phaser";
import type { TimelineController } from "./TimelineController";
import {
  ACTOR_FRAMES,
  BIKE_SYMBOL_FRAME,
  BIKE_SYMBOL_TILES,
  GROUND_FRAMES,
  OBJECT_FRAMES,
  OVERLAY_FRAMES,
  SHEET_KEY,
  SHEET_URL,
  TILE,
} from "./sprites";

export interface SceneHooks {
  /** Player clicked an editable object in the scene. */
  onObjectClicked(objectId: string): void;
  /** Pointer entered (id) or left (null) an editable object. */
  onObjectHover(objectId: string | null): void;
  /** Called once per frame after the playhead advances, so the DOM UI can refresh. */
  onFrame(): void;
}

const center = (tileCoord: number): number => tileCoord * TILE + TILE / 2;

export class GameScene extends Phaser.Scene {
  private readonly actorSprites = new Map<string, Phaser.GameObjects.Container>();
  private readonly objectSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly highlights = new Map<string, Phaser.GameObjects.Rectangle>();
  private signalLamp: Phaser.GameObjects.Arc | null = null;
  private crashMarker: Phaser.GameObjects.Text | null = null;
  private hovered: string | null = null;

  constructor(
    private readonly timeline: TimelineController,
    private readonly hooks: SceneHooks,
  ) {
    super("game");
  }

  /** Highlights an object from outside the scene (e.g. hovering its DOM button). */
  setHovered(objectId: string | null): void {
    this.hovered = objectId;
  }

  preload(): void {
    this.load.spritesheet(SHEET_KEY, SHEET_URL, { frameWidth: TILE, frameHeight: TILE });
  }

  create(): void {
    const puzzle = this.timeline.puzzle;
    this.drawMap(puzzle.map);

    for (const obj of puzzle.objects) {
      const frame = OBJECT_FRAMES[obj.kind === "obstacle" ? obj.appearance : obj.kind] ?? 0;
      const highlight = this.add.rectangle(0, 0, TILE + 2, TILE + 2).setStrokeStyle(1, 0xffe066).setDepth(5);
      this.highlights.set(obj.id, highlight);
      this.tweens.add({ targets: highlight, alpha: { from: 1, to: 0.25 }, duration: 600, yoyo: true, repeat: -1 });

      const sprite = this.add.image(0, 0, SHEET_KEY, frame).setDepth(6).setInteractive({ useHandCursor: true });
      sprite.on("pointerdown", () => this.hooks.onObjectClicked(obj.id));
      sprite.on("pointerover", () => this.hooks.onObjectHover(obj.id));
      sprite.on("pointerout", () => this.hooks.onObjectHover(null));
      this.objectSprites.set(obj.id, sprite);

      if (obj.kind === "traffic_light") {
        this.signalLamp = this.add.circle(center(obj.tile.x) - 4, center(obj.tile.y) - 1, 2.5, 0x2ecc71).setDepth(7);
      }
    }

    for (const actor of puzzle.actors) {
      const frames = ACTOR_FRAMES[actor.kind];
      const container = this.add.container(0, 0).setDepth(10);
      if (frames.length === 2) {
        // 1x2 vehicle sprite: stack the halves vertically, then rotate so the front faces east.
        container.add(this.add.image(0, -TILE / 2, SHEET_KEY, frames[0]));
        container.add(this.add.image(0, TILE / 2, SHEET_KEY, frames[1]));
        container.setAngle(-90).setDepth(9);
      } else {
        container.add(this.add.image(0, -2, SHEET_KEY, frames[0]));
      }
      this.actorSprites.set(actor.id, container);
    }

    this.crashMarker = this.add
      .text(0, 0, "!", { fontFamily: "monospace", fontSize: "12px", color: "#ff3b3b", stroke: "#000", strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.refresh();
  }

  override update(_time: number, delta: number): void {
    this.timeline.update(delta);
    this.refresh();
    this.hooks.onFrame();
  }

  private refresh(): void {
    const tl = this.timeline;

    for (const obj of tl.puzzle.objects) {
      const tile = tl.objectTile(obj.id);
      const selected = tl.selected?.objectId === obj.id;
      this.objectSprites.get(obj.id)!.setPosition(center(tile.x), center(tile.y));
      const highlight = this.highlights.get(obj.id)!;
      highlight.setPosition(center(tile.x), center(tile.y));
      highlight.setVisible(tl.canEdit || selected);
      highlight.setStrokeStyle(selected ? 2 : 1, selected ? 0x4cd964 : this.hovered === obj.id ? 0xffffff : 0xffe066);
      if (obj.kind === "traffic_light" && this.signalLamp) {
        this.signalLamp.setFillStyle(tl.signalGreen(obj.id) ? 0x2ecc71 : 0xff3b30);
      }
    }

    for (const [id, sprite] of this.actorSprites) {
      const pose = tl.actorPose(id);
      sprite.setPosition(center(pose.x), center(pose.y));
      sprite.setVisible(pose.status !== "arrived");
      const body = sprite.list[0] as Phaser.GameObjects.Image;
      if (sprite.list.length === 1) {
        // Characters: face the direction of travel; fall over when killed.
        if (pose.dx !== 0) body.setFlipX(pose.dx < 0);
        sprite.setAngle(pose.status === "dead" ? 90 : 0);
        body.setTint(pose.status === "dead" ? 0xff8080 : 0xffffff);
      } else {
        for (const part of sprite.list as Phaser.GameObjects.Image[]) part.setTint(pose.status === "crashed" ? 0xb0b0b0 : 0xffffff);
      }
    }

    const crash = tl.visibleEvents().find((e) => e.type === "collision");
    if (this.crashMarker) {
      const node = crash?.type === "collision" ? tl.puzzle.nodes.find((n) => n.id === crash.nodeId) : undefined;
      this.crashMarker.setVisible(node !== undefined);
      if (node) this.crashMarker.setPosition(center(node.x), center(node.y) - TILE);
    }
  }

  private drawMap(map: readonly string[]): void {
    map.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        this.add.image(center(x), center(y), SHEET_KEY, GROUND_FRAMES[ch] ?? 0).setDepth(0);
        const overlay = OVERLAY_FRAMES[ch];
        if (overlay !== undefined) this.add.image(center(x), center(y), SHEET_KEY, overlay).setDepth(1);
        if (BIKE_SYMBOL_TILES.includes(`${x},${y}`)) this.add.image(center(x), center(y), SHEET_KEY, BIKE_SYMBOL_FRAME).setDepth(1);
      });
    });
  }
}
