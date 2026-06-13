import {
  MapEditor,
  encodeCustomMap,
  generateClassicMap,
  mapObject,
  mapTerrain,
  mapMinerals,
  type ClassicMapLandscape,
  type MapRegionClip,
  type SerfboundCustomMap,
} from "@serfbound/engine";
import {
  buildLandscapeRenderAssets,
  createLandscapeScene,
  screenToMapTile,
  type MapScroll,
} from "./landscape-scene.js";
import {
  renderFirstRenderLayerScene,
  type DecodedRenderAssets,
} from "./render-layer-scene.js";

// SB-42-05: the map editor on screen. The builder shipped as engine
// code (MapEditor); this is the surface that makes it reachable — the
// player paints on the *authentic* tiles (import-gated, never synthetic),
// validates, and plays. The pure reducer and the tool palette are
// CI-held; the controller's render/pointer loop is the browser surface.

// A palette tool is a labelled descriptor; `applyEditorTool` is the only
// thing that mutates the editor, so the reducer is pure and testable
// apart from any DOM or WebGL.
export type EditorTool =
  | { readonly kind: "terrain"; readonly id: string; readonly label: string; readonly terrain: number; readonly radius: number }
  | { readonly kind: "height"; readonly id: string; readonly label: string; readonly delta: number; readonly radius: number }
  | { readonly kind: "flatten"; readonly id: string; readonly label: string; readonly base: number; readonly radius: number }
  | { readonly kind: "object"; readonly id: string; readonly label: string; readonly object: number }
  | { readonly kind: "erase-object"; readonly id: string; readonly label: string }
  | { readonly kind: "mineral"; readonly id: string; readonly label: string; readonly mineral: number; readonly amount: number }
  | { readonly kind: "fish"; readonly id: string; readonly label: string; readonly amount: number }
  | { readonly kind: "start"; readonly id: string; readonly label: string; readonly player: number; readonly supplies: number }
  | { readonly kind: "clear-start"; readonly id: string; readonly label: string; readonly player: number };

// The palette the surface offers. Terrain by family (the legal authored
// types), a height pair, the authorable objects, minerals, fish, and the
// four player starts. IDs are stable so the UI and tests reference them.
export const editorTools: readonly EditorTool[] = [
  { kind: "terrain", id: "grass", label: "Grass", terrain: mapTerrain.grass1, radius: 1 },
  { kind: "terrain", id: "water", label: "Water", terrain: mapTerrain.water0, radius: 1 },
  { kind: "terrain", id: "desert", label: "Desert", terrain: mapTerrain.desert1, radius: 1 },
  { kind: "terrain", id: "tundra", label: "Mountain", terrain: mapTerrain.tundra1, radius: 1 },
  { kind: "terrain", id: "snow", label: "Snow", terrain: mapTerrain.snow0, radius: 1 },
  { kind: "height", id: "raise", label: "Raise", delta: 8, radius: 1 },
  { kind: "height", id: "lower", label: "Lower", delta: -8, radius: 1 },
  { kind: "flatten", id: "flatten", label: "Flatten", base: 0, radius: 1 },
  { kind: "object", id: "tree", label: "Tree", object: mapObject.tree0 },
  { kind: "object", id: "pine", label: "Pine", object: mapObject.pine0 },
  { kind: "object", id: "stone", label: "Stone", object: mapObject.stone0 },
  { kind: "erase-object", id: "erase", label: "Clear" },
  { kind: "mineral", id: "gold", label: "Gold", mineral: mapMinerals.gold, amount: 8 },
  { kind: "mineral", id: "iron", label: "Iron", mineral: mapMinerals.iron, amount: 8 },
  { kind: "mineral", id: "coal", label: "Coal", mineral: mapMinerals.coal, amount: 8 },
  { kind: "fish", id: "fish", label: "Fish", amount: 8 },
  { kind: "start", id: "start1", label: "Start ①", player: 0, supplies: 30 },
  { kind: "start", id: "start2", label: "Start ②", player: 1, supplies: 30 },
  { kind: "start", id: "start3", label: "Start ③", player: 2, supplies: 30 },
  { kind: "start", id: "start4", label: "Start ④", player: 3, supplies: 30 },
];

export function findEditorTool(id: string): EditorTool | undefined {
  return editorTools.find((tool) => tool.id === id);
}

// Apply one tool at one map position. Terrain and height edits are
// grouped into a single undoable stroke; the rest are single edits. The
// editor enforces all legality (slope clamp, water/land object rules,
// castle-placeable starts) — the reducer just dispatches.
export function applyEditorTool(
  editor: MapEditor,
  tool: EditorTool,
  position: number,
  radiusOverride?: number,
): { readonly ok: boolean } {
  // Terrain/height/flatten honour the active brush size when given.
  const radiusFor = (toolRadius: number) =>
    radiusOverride === undefined ? toolRadius : Math.max(0, Math.floor(radiusOverride));
  switch (tool.kind) {
    case "terrain":
      editor.beginStroke();
      editor.paintTerrain(position, tool.terrain, radiusFor(tool.radius));
      editor.endStroke();
      return { ok: true };
    case "height":
      editor.beginStroke();
      editor.raiseHeight(position, tool.delta, radiusFor(tool.radius));
      editor.endStroke();
      return { ok: true };
    case "flatten":
      editor.beginStroke();
      editor.setHeight(position, tool.base, radiusFor(tool.radius));
      editor.endStroke();
      return { ok: true };
    case "object":
      return { ok: editor.placeObject(position, tool.object) };
    case "erase-object":
      editor.eraseObject(position);
      return { ok: true };
    case "mineral":
      return { ok: editor.seedMineral(position, tool.mineral, tool.amount) };
    case "fish":
      return { ok: editor.seedFish(position, tool.amount) };
    case "start":
      return { ok: editor.setStart(tool.player, position, tool.supplies) };
    case "clear-start":
      editor.clearStart(tool.player);
      return { ok: true };
    default:
      return { ok: false };
  }
}

// A fresh editable map: a generated landscape gives real terrain to
// shape (better than a blank plate), seeded from a stable base so a
// "new map" is reproducible within a session.
export function newEditableLandscape(size = 5): ClassicMapLandscape {
  return generateClassicMap(size, [1, 2, 3]);
}

// Encode the editor's current state as a playable/publishable record.
export function editorToCustomMap(editor: MapEditor, title: string, authorKeyId: string, authorName: string, createdAtIso: string): SerfboundCustomMap {
  const starts = editor.starts;
  return encodeCustomMap(
    editor.toLandscape(),
    { title, authorKeyId, authorName, createdAtIso },
    { playerCount: Math.max(1, starts.length), starts },
  );
}

export type MapEditorScreenOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly paletteHost: HTMLElement;
  readonly statusHost: HTMLElement;
  readonly decodedAssets: DecodedRenderAssets;
  readonly pixelRatio?: number;
  readonly authorKeyId: string;
  readonly authorName: string;
  readonly nowIso: () => string;
  readonly onPlay: (map: SerfboundCustomMap) => void;
  readonly onExit: () => void;
  // Reports each render so the host can mirror the scene datasets the
  // shell exposes (scene mode, sprite count) for tests and the device gate.
  readonly onRender?: (info: { readonly spriteCount: number; readonly mode: "landscape" }) => void;
  readonly initialSize?: number;
};

// The on-screen controller. Owns a MapEditor, paints via pointer, and
// re-renders the authentic landscape on every edit.
export class MapEditorScreen {
  readonly #options: MapEditorScreenOptions;
  #editor: MapEditor;
  #activeToolId: string;
  #brushRadius = 1;
  #scroll: MapScroll = { column: 0, row: 0 };
  #disposed = false;
  #pointerHandler: ((event: PointerEvent) => void) | undefined;
  // Region copy/paste (SB-42-07): a small click-sequence machine that
  // sits over painting. "off" paints normally; "select-a"/"select-b"
  // mark a rectangle (then copy it); "paste" drops the clip on click.
  #regionMode: "off" | "select-a" | "select-b" | "paste" = "off";
  #regionCornerA: number | null = null;
  #clip: MapRegionClip | null = null;

  constructor(options: MapEditorScreenOptions) {
    this.#options = options;
    this.#editor = new MapEditor(newEditableLandscape(options.initialSize ?? 5));
    this.#activeToolId = editorTools[0]!.id;
    this.#buildPalette();
    this.#bindPointer();
    this.render();
    this.#renderStatus();
  }

  get editor(): MapEditor {
    return this.#editor;
  }

  get activeTool(): EditorTool {
    return findEditorTool(this.#activeToolId) ?? editorTools[0]!;
  }

  setActiveTool(id: string): void {
    if (findEditorTool(id) === undefined) {
      return;
    }
    this.#activeToolId = id;
    this.#syncPaletteSelection();
  }

  get brushRadius(): number {
    return this.#brushRadius;
  }

  setBrushRadius(radius: number): void {
    this.#brushRadius = Math.min(3, Math.max(1, Math.floor(radius)));
    this.#syncPaletteSelection();
  }

  // A canvas click at a map position. In region mode it drives the
  // copy/paste sequence; otherwise it paints the active tool.
  applyAt(position: number): void {
    if (this.#regionMode !== "off") {
      this.#handleRegionClick(position);
      return;
    }
    applyEditorTool(this.#editor, this.activeTool, position, this.#brushRadius);
    this.render();
    this.#renderStatus();
  }

  // Enter copy mode: the next two clicks mark the rectangle's corners.
  beginCopy(): void {
    this.#regionMode = "select-a";
    this.#regionCornerA = null;
    this.#syncPaletteSelection();
    this.#renderStatus();
  }

  // Enter paste mode (only meaningful once a clip exists): the next
  // click drops the clip with that tile as its top-left corner.
  beginPaste(): void {
    if (this.#clip === null) {
      return;
    }
    this.#regionMode = "paste";
    this.#syncPaletteSelection();
    this.#renderStatus();
  }

  get hasClip(): boolean {
    return this.#clip !== null;
  }

  get regionMode(): "off" | "select-a" | "select-b" | "paste" {
    return this.#regionMode;
  }

  #handleRegionClick(position: number): void {
    if (this.#regionMode === "select-a") {
      this.#regionCornerA = position;
      this.#regionMode = "select-b";
    } else if (this.#regionMode === "select-b" && this.#regionCornerA !== null) {
      this.#clip = this.#editor.copyRegion(this.#regionCornerA, position);
      this.#regionMode = "off";
      this.#regionCornerA = null;
    } else if (this.#regionMode === "paste" && this.#clip !== null) {
      this.#editor.pasteRegion(this.#clip, position);
      this.#regionMode = "off";
      this.render();
    }
    this.#syncPaletteSelection();
    this.#renderStatus();
  }

  render(): void {
    const { canvas, decodedAssets } = this.#options;
    // Render at CSS resolution (pixelRatio 1) so a pointer's CSS
    // coordinates map straight back to a tile via screenToMapTile —
    // the editor trades a touch of HiDPI crispness for click accuracy.
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || canvas.width || 960));
    const height = Math.max(1, Math.round(rect.height || canvas.height || 540));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const landscape = this.#editor.toLandscape();
    const assets = buildLandscapeRenderAssets(decodedAssets, landscape);
    if (assets === null) {
      return;
    }
    const scene = createLandscapeScene({
      size: { width, height },
      assets,
      scroll: this.#scroll,
      tick: 0,
    });
    renderFirstRenderLayerScene(canvas, scene);
    this.#options.onRender?.({ spriteCount: scene.sprites.length, mode: "landscape" });
  }

  validate(): void {
    this.#renderStatus();
  }

  dispose(): void {
    this.#disposed = true;
    if (this.#pointerHandler !== undefined) {
      this.#options.canvas.removeEventListener("pointerdown", this.#pointerHandler);
      this.#pointerHandler = undefined;
    }
    this.#options.paletteHost.replaceChildren();
    this.#options.statusHost.replaceChildren();
  }

  #buildPalette(): void {
    const host = this.#options.paletteHost;
    const doc = host.ownerDocument;
    host.replaceChildren();
    for (const tool of editorTools) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "editor-tool";
      button.dataset["toolId"] = tool.id;
      button.dataset["testid"] = `editor-tool-${tool.id}`;
      button.textContent = tool.label;
      button.addEventListener("click", () => this.setActiveTool(tool.id));
      host.appendChild(button);
    }

    // The brush-size control: 1/2/3, applied to terrain/height/flatten.
    const sizeGroup = doc.createElement("span");
    sizeGroup.className = "editor-size";
    sizeGroup.dataset["testid"] = "editor-size";
    const sizeLabel = doc.createElement("span");
    sizeLabel.className = "editor-size__label";
    sizeLabel.textContent = "Brush";
    sizeGroup.appendChild(sizeLabel);
    for (const radius of [1, 2, 3]) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "editor-size__button";
      button.dataset["brushRadius"] = String(radius);
      button.dataset["testid"] = `editor-brush-${radius}`;
      button.textContent = String(radius);
      button.addEventListener("click", () => this.setBrushRadius(radius));
      sizeGroup.appendChild(button);
    }
    host.appendChild(sizeGroup);

    this.#syncPaletteSelection();
  }

  #syncPaletteSelection(): void {
    for (const button of this.#options.paletteHost.querySelectorAll<HTMLButtonElement>(".editor-tool")) {
      button.setAttribute(
        "aria-pressed",
        button.dataset["toolId"] === this.#activeToolId ? "true" : "false",
      );
    }
    for (const button of this.#options.paletteHost.querySelectorAll<HTMLButtonElement>(".editor-size__button")) {
      button.setAttribute(
        "aria-pressed",
        button.dataset["brushRadius"] === String(this.#brushRadius) ? "true" : "false",
      );
    }
  }

  #renderStatus(): void {
    const host = this.#options.statusHost;
    const playerCount = Math.max(1, this.#editor.starts.length);
    const verdict = this.#editor.validate(playerCount);
    const parts: string[] = [];

    // Region copy/paste prompt comes first when a sequence is active.
    const regionHint =
      this.#regionMode === "select-a"
        ? "Copy region: click the first corner."
        : this.#regionMode === "select-b"
          ? "Copy region: click the opposite corner."
          : this.#regionMode === "paste"
            ? "Paste: click where the region's top-left goes."
            : this.#clip !== null
              ? `Copied ${this.#clip.columns}×${this.#clip.rows} — press Paste, then click.`
              : null;
    if (regionHint !== null) {
      parts.push(`<p class="editor-status__region" data-testid="editor-region-hint">${regionHint}</p>`);
    }

    parts.push(
      verdict.playable
        ? `<p class="editor-status__ok" data-testid="editor-verdict">Playable — ${this.#editor.starts.length} start${this.#editor.starts.length === 1 ? "" : "s"}, ${(verdict.buildableRatio * 100).toFixed(0)}% buildable.</p>`
        : `<p class="editor-status__warn" data-testid="editor-verdict">Not playable yet: ${verdict.errors.map((error) => error.kind).join(", ") || "place a start"}.</p>`,
    );
    host.innerHTML = parts.join("");
  }

  #bindPointer(): void {
    const { canvas } = this.#options;
    const paintFromEvent = (event: PointerEvent) => {
      if (this.#disposed) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const tile = screenToMapTile(this.#editor.toLandscape(), screen, this.#scroll, 1);
      this.applyAt(tile.position);
    };
    this.#pointerHandler = paintFromEvent;
    canvas.addEventListener("pointerdown", paintFromEvent);
  }

  // "Play this map": hand a fresh custom-map record to the host.
  play(title = "My map"): void {
    const map = editorToCustomMap(
      this.#editor,
      title,
      this.#options.authorKeyId,
      this.#options.authorName,
      this.#options.nowIso(),
    );
    this.#options.onPlay(map);
  }

  exit(): void {
    this.#options.onExit();
  }
}
