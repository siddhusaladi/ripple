// DOM controls and messages around the Phaser canvas. Reads the TimelineController and
// calls its commands; all outcome text comes from simulation events via explainRun.
import type { TimelineController } from "../game/TimelineController";
import { explainRun } from "../simulation/report";
import type { Intervention, SimEvent } from "../simulation/types";

export interface ControlsHooks {
  onObjectHover(objectId: string | null): void;
}

interface Attempt {
  readonly label: string;
  readonly success: boolean;
}

export class Controls {
  private readonly el: Record<string, HTMLElement> = {};
  private readonly objectButtons = new Map<string, HTMLButtonElement>();
  private readonly attempts: Attempt[] = [];
  private lastKey = "";
  private recordedRun = -1;

  constructor(
    root: HTMLElement,
    private readonly tl: TimelineController,
    private readonly hooks: ControlsHooks,
  ) {
    const puzzle = tl.puzzle;
    root.innerHTML = `
      <p class="story" data-el="story"></p>
      <section class="objects">
        <h2>Change one thing</h2>
        <div data-el="objectList"></div>
      </section>
      <div class="buttons">
        <button data-el="play" class="primary"></button>
        <button data-el="rewind" title="Back to the start of the morning (R)">⏪ Rewind</button>
        <button data-el="reset" title="Undo your change and rewind">↺ Reset</button>
        <button data-el="speed" title="Playback speed">1×</button>
      </div>
      <div class="timeline" aria-label="Timeline">
        <div class="track"><div class="fill" data-el="fill"></div><div data-el="markers"></div></div>
        <div class="tick" data-el="tick"></div>
      </div>
      <section class="result" data-el="result" hidden>
        <h2 data-el="resultTitle"></h2>
        <ul data-el="explanation"></ul>
      </section>
      <section class="attempts" data-el="attemptsBox" hidden>
        <h2>Your attempts</h2>
        <ol data-el="attemptList"></ol>
      </section>
      <details class="log">
        <summary>Simulation event log</summary>
        <ol data-el="log"></ol>
      </details>`;
    root.querySelectorAll<HTMLElement>("[data-el]").forEach((node) => (this.el[node.dataset.el!] = node));

    for (const obj of puzzle.objects) {
      const mod = obj.modifications[0]!;
      const button = document.createElement("button");
      button.className = "object";
      button.innerHTML = `<strong>${obj.label}</strong><span>${mod.label}</span><small>${mod.description}</small>`;
      button.addEventListener("click", () => this.command(() => this.toggle({ objectId: obj.id, modificationId: mod.id })));
      button.addEventListener("mouseenter", () => this.hooks.onObjectHover(obj.id));
      button.addEventListener("mouseleave", () => this.hooks.onObjectHover(null));
      this.el.objectList!.append(button);
      this.objectButtons.set(obj.id, button);
    }

    this.el.play!.addEventListener("click", () => this.command(() => this.playPause()));
    this.el.rewind!.addEventListener("click", () => this.command(() => tl.rewind()));
    this.el.reset!.addEventListener("click", () => this.command(() => tl.reset()));
    this.el.speed!.addEventListener("click", () => {
      tl.ticksPerSecond = tl.ticksPerSecond === 2 ? 5 : 2;
      this.el.speed!.textContent = tl.ticksPerSecond === 2 ? "1×" : "2.5×";
    });
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLElement && e.target.tagName === "BUTTON" && e.key === " ") return;
      if (e.key === " ") {
        e.preventDefault();
        this.command(() => this.playPause());
      } else if (e.key === "r" || e.key === "R") {
        this.command(() => tl.rewind());
      }
    });
    this.render();
  }

  /** Clicking an object in the scene behaves like clicking its button. */
  selectFromScene(objectId: string): void {
    const obj = this.tl.puzzle.objects.find((o) => o.id === objectId);
    if (obj) this.command(() => this.toggle({ objectId, modificationId: obj.modifications[0]!.id }));
  }

  highlight(objectId: string | null): void {
    for (const [id, button] of this.objectButtons) button.classList.toggle("hover", id === objectId);
  }

  /** Runs a player command and refreshes the panel immediately, instead of on the next Phaser frame. */
  private command(action: () => void): void {
    action();
    this.render();
  }

  private toggle(intervention: Intervention): void {
    if (!this.tl.canEdit) return; // edits only at tick 0 or after a run; buttons are disabled meanwhile
    this.tl.select(intervention);
  }

  private playPause(): void {
    if (this.tl.phase === "playing") this.tl.pause();
    else this.tl.play();
  }

  /** Called every frame; only touches the DOM when something visible changed. */
  render(): void {
    const tl = this.tl;
    const result = tl.result;
    this.el.fill!.style.width = `${(tl.playhead / Math.max(result.endTick, 1)) * 100}%`;

    const key = [tl.phase, tl.tick, tl.selected?.objectId ?? "-", result.endTick, tl.ticksPerSecond].join("|");
    if (key === this.lastKey) return;
    this.lastKey = key;

    const finished = tl.phase === "finished";
    if (finished && this.recordedRun !== tl.runsStarted) {
      this.recordedRun = tl.runsStarted;
      this.attempts.push({ label: this.describeSelection(), success: result.success });
    }

    this.el.story!.textContent = this.storyText();
    this.el.play!.textContent =
      tl.phase === "playing" ? "⏸ Pause" : tl.phase === "paused" ? "▶ Resume" : finished ? "▶ Replay" : tl.runsStarted === 0 ? "▶ Play" : "▶ Replay";
    (this.el.rewind as HTMLButtonElement).disabled = tl.phase === "ready";
    (this.el.reset as HTMLButtonElement).disabled = tl.phase === "ready" && tl.selected === null;
    this.el.tick!.textContent = `t = ${tl.tick} s${finished ? " (end)" : ""}`;

    for (const [id, button] of this.objectButtons) {
      button.classList.toggle("selected", tl.selected?.objectId === id);
      button.disabled = tl.phase === "playing" || tl.phase === "paused";
    }

    this.renderMarkers(tl.visibleEvents(), result.endTick);

    const resultBox = this.el.result!;
    resultBox.hidden = !finished;
    resultBox.classList.toggle("success", finished && result.success);
    resultBox.classList.toggle("failure", finished && !result.success);
    if (finished) {
      const hero = tl.puzzle.actors.find((a) => a.id === tl.puzzle.protagonist)?.label ?? "The pedestrian";
      this.el.resultTitle!.textContent = result.success ? `${hero} made it!` : `${hero} didn't make it.`;
      this.el.explanation!.replaceChildren(...explainRun(tl.puzzle, result, tl.baseline).map((line) => li(line)));
    }

    this.el.attemptsBox!.hidden = this.attempts.length === 0;
    this.el.attemptList!.replaceChildren(...this.attempts.map((a) => li(`${a.success ? "✔" : "✘"} ${a.label}`)));

    this.el.log!.replaceChildren(...tl.visibleEvents().map((e) => li(friendlyEvent(tl, e))));
  }

  private storyText(): string {
    const tl = this.tl;
    const change = this.describeSelection();
    switch (tl.phase) {
      case "ready":
        if (tl.runsStarted === 0 && tl.selected === null) return `${tl.puzzle.intro} Press Play to watch the morning unfold.`;
        if (tl.selected === null) return "Rewound to 7:00. Pick one object to change, then press Replay.";
        return `Change ready: ${change}. Press Replay to see what happens.`;
      case "playing":
      case "paused":
        return tl.selected === null ? "Watching the original morning…" : `Replaying with your change: ${change}…`;
      case "finished":
        if (tl.result.success) return "You broke the chain. Try the other objects to see what else would have worked.";
        return tl.selected === null
          ? "That was the accident. Rewind and change one thing in the neighborhood."
          : "Something changed, but not enough. Rewind and try a different object.";
    }
  }

  private describeSelection(): string {
    const sel = this.tl.selected;
    if (!sel) return "No change";
    const obj = this.tl.puzzle.objects.find((o) => o.id === sel.objectId);
    const mod = obj?.modifications.find((m) => m.id === sel.modificationId);
    return `${obj?.label ?? sel.objectId}: ${mod?.label ?? sel.modificationId}`;
  }

  private renderMarkers(events: readonly SimEvent[], endTick: number): void {
    const markers: HTMLElement[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      let kind: string | null = null;
      if (e.type === "collision") kind = "crash";
      else if (e.type === "waited_at_signal") kind = "wait";
      else if (e.type === "arrived" && e.actorId === this.tl.puzzle.protagonist) kind = "safe";
      if (!kind || seen.has(`${kind}${e.tick}`)) continue;
      seen.add(`${kind}${e.tick}`);
      const m = document.createElement("span");
      m.className = `marker ${kind}`;
      m.style.left = `${(e.tick / Math.max(endTick, 1)) * 100}%`;
      m.title = `t=${e.tick}: ${kind}`;
      markers.push(m);
    }
    this.el.markers!.replaceChildren(...markers);
  }
}

function li(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

/** Player-facing wording for the event log. */
function friendlyEvent(tl: TimelineController, e: SimEvent): string {
  const p = tl.puzzle;
  const actor = (id: string): string => p.actors.find((a) => a.id === id)?.label ?? id;
  const t = `t=${e.tick}`;
  switch (e.type) {
    case "object_modified":
      return `${t} ${p.objects.find((o) => o.id === e.objectId)?.label ?? e.objectId} changed`;
    case "route_planned":
      return `${t} ${actor(e.actorId)} sets off (${e.segments} steps)`;
    case "route_changed":
      return `${t} ${actor(e.actorId)} picks a new route (${e.baselineSegments ?? "?"} → ${e.segments} steps)`;
    case "no_route":
      return `${t} ${actor(e.actorId)} has no way through`;
    case "waited_at_signal":
      return `${t} ${actor(e.actorId)} waits at a red light`;
    case "entered_landmark":
      return `${t} ${actor(e.actorId)} reaches ${p.landmarks.find((l) => l.id === e.landmarkId)?.label ?? e.landmarkId}`;
    case "collision":
      return `${t} CRASH: ${e.actorIds.map(actor).join(" and ")}`;
    case "died":
      return `${t} ${actor(e.actorId)} is killed`;
    case "arrived":
      return `${t} ${actor(e.actorId)} arrives`;
    case "completed":
      return `${t} end of the morning`;
  }
}
