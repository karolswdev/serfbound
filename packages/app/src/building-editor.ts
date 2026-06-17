// SB-44 dev tool: a god-mode building editor overlay. When armed it highlights
// every building on the map; click one to select it, then move it to another
// tile, replace it with a different type, or delete it — and place fresh
// buildings anywhere from a palette. It is a self-contained overlay: it does
// its own screen<->tile picking (mapTileToScreen / screenToMapTile) above the
// canvas and mutates the live world directly, so the app layer only has to hand
// it the current world + view handles. Inert until mounted, and the launcher
// only shows when a world is running.

import { buildingType } from "@serfbound/engine";

import { mapTileToScreen, screenToMapTile } from "./landscape-scene.js";

type Landscape = Parameters<typeof mapTileToScreen>[0];
type Scroll = Parameters<typeof mapTileToScreen>[2];

// Structural views of the engine types — we only touch what we use, so the
// editor stays decoupled from the full WorldBuilding / world surface.
type EditorBuilding = {
  readonly index: number;
  readonly position: number;
  type: number;
  player: number;
  isDone: boolean;
  progress: number;
};

type EditorWorld = {
  // ReadonlyMap is covariant in its value, so the engine's
  // Map<number, WorldBuilding> assigns cleanly (a mutable Map is invariant).
  readonly buildings: ReadonlyMap<number, EditorBuilding>;
  readonly columns: number;
  buildingAt(position: number): EditorBuilding | null;
  canBuildBuilding(position: number, type: number, player: number): boolean;
  buildBuilding(position: number, type: number, player: number, atTick?: number): EditorBuilding | null;
  demolishBuildingAt(position: number): boolean;
};

export type BuildingEditorAccess = {
  readonly canvas: HTMLCanvasElement;
  readonly getWorld: () => EditorWorld | undefined;
  readonly getView: () => { landscape: Landscape; scroll: Scroll; worldScale: number } | undefined;
  readonly getPlayer: () => number;
  readonly getTick: () => number;
  readonly requestRender: () => void;
};

// Placeable types, in a sensible palette order (skip `none`). Castle is last —
// it is special (territory + defeat), but useful to drop in a debug map.
const PLACEABLE: readonly { value: number; label: string }[] = Object.entries(buildingType)
  .filter(([, value]) => value !== buildingType.none)
  .map(([label, value]) => ({ value: value as number, label }));

function titleCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function buildingName(type: number): string {
  const entry = PLACEABLE.find((b) => b.value === type);
  return entry === undefined ? `type ${type}` : titleCase(entry.label);
}

// Player colours for the marker rings — mirrors the classic four-player set.
const PLAYER_COLOR = ["#54b0ff", "#ff5a52", "#5ad15a", "#e7c14a"];

type Mode = { kind: "idle" } | { kind: "place"; type: number } | { kind: "move"; index: number };

export function mountBuildingEditor(root: HTMLElement, access: BuildingEditorAccess): () => void {
  const { canvas } = access;
  // God-mode is a dev tool — only available under ?rig= or ?dev=1, never in a
  // normal player's game. When disabled the mount is a no-op disposer.
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  if (!params.has("rig") && params.get("dev") !== "1") {
    return () => {};
  }
  let active = false;
  let mode: Mode = { kind: "idle" };
  let selectedIndex: number | null = null;
  let rafHandle = 0;
  const markers = new Map<number, HTMLButtonElement>();

  // ── Launcher (always visible while a world runs) ──────────────────────
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.dataset.testid = "building-editor-launch";
  launcher.textContent = "✛ Edit";
  Object.assign(launcher.style, {
    position: "fixed", left: "12px", bottom: "12px", zIndex: "70",
    font: "600 13px ui-sans-serif, system-ui, sans-serif", color: "#f2ecd8",
    background: "rgba(16,20,17,0.88)", border: "1px solid #b89f5a", borderRadius: "8px",
    padding: "8px 14px", cursor: "pointer", backdropFilter: "blur(2px)",
  } satisfies Partial<CSSStyleDeclaration>);

  // ── Canvas-tracking overlay (markers live here) ───────────────────────
  const overlay = document.createElement("div");
  overlay.dataset.testid = "building-editor-overlay";
  Object.assign(overlay.style, {
    position: "fixed", left: "0", top: "0", width: "0", height: "0",
    zIndex: "65", display: "none", overflow: "hidden", pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);

  // ── Toolbar (palette + hint) ──────────────────────────────────────────
  const toolbar = document.createElement("div");
  Object.assign(toolbar.style, {
    position: "fixed", left: "12px", bottom: "56px", zIndex: "70", display: "none",
    width: "232px", maxHeight: "70vh", overflowY: "auto",
    background: "rgba(16,20,17,0.94)", border: "1px solid #b89f5a", borderRadius: "10px",
    padding: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
    font: "13px ui-sans-serif, system-ui, sans-serif", color: "#f2ecd8",
  } satisfies Partial<CSSStyleDeclaration>);

  const hint = document.createElement("div");
  Object.assign(hint.style, { color: "#a7b9a8", fontSize: "12px", margin: "0 0 10px", lineHeight: "1.4" });

  const paletteLabel = document.createElement("div");
  paletteLabel.textContent = "PLACE BUILDING";
  Object.assign(paletteLabel.style, {
    fontSize: "10px", letterSpacing: "0.14em", color: "#d7c584", fontWeight: "700", margin: "0 0 6px",
  });
  const palette = document.createElement("div");
  Object.assign(palette.style, { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" });

  const paletteButtons = new Map<number, HTMLButtonElement>();
  const styleChip = (btn: HTMLButtonElement, on: boolean): void => {
    btn.style.background = on ? "#b89f5a" : "rgba(36,42,36,0.9)";
    btn.style.color = on ? "#221d14" : "#f2ecd8";
    btn.style.borderColor = on ? "#d7c584" : "rgba(242,236,216,0.18)";
  };
  for (const entry of PLACEABLE) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = titleCase(entry.label);
    Object.assign(chip.style, {
      font: "600 11px ui-sans-serif, system-ui, sans-serif", padding: "6px 4px",
      border: "1px solid rgba(242,236,216,0.18)", borderRadius: "6px", cursor: "pointer",
    });
    styleChip(chip, false);
    chip.addEventListener("click", () => {
      mode = mode.kind === "place" && mode.type === entry.value ? { kind: "idle" } : { kind: "place", type: entry.value };
      syncModeUi();
    });
    paletteButtons.set(entry.value, chip);
    palette.append(chip);
  }
  toolbar.append(hint, paletteLabel, palette);

  // ── Selection popover ─────────────────────────────────────────────────
  const popover = document.createElement("div");
  Object.assign(popover.style, {
    position: "fixed", zIndex: "71", display: "none", minWidth: "150px",
    background: "rgba(16,20,17,0.96)", border: "1px solid #d7c584", borderRadius: "10px",
    padding: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
    font: "13px ui-sans-serif, system-ui, sans-serif", color: "#f2ecd8",
  } satisfies Partial<CSSStyleDeclaration>);

  const popTitle = document.createElement("div");
  Object.assign(popTitle.style, { fontWeight: "700", margin: "0 0 8px" });
  const popActions = document.createElement("div");
  Object.assign(popActions.style, { display: "flex", gap: "6px", flexWrap: "wrap" });

  const actionButton = (text: string, onClick: () => void): HTMLButtonElement => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    Object.assign(btn.style, {
      font: "600 12px ui-sans-serif, system-ui, sans-serif", color: "#f2ecd8",
      background: "rgba(36,42,36,0.9)", border: "1px solid rgba(242,236,216,0.2)",
      borderRadius: "6px", padding: "6px 10px", cursor: "pointer",
    });
    btn.addEventListener("click", onClick);
    return btn;
  };
  popover.append(popTitle, popActions);

  // ── Helpers ───────────────────────────────────────────────────────────
  const showHint = (text: string): void => { hint.textContent = text; };

  const buildingScreenPos = (
    position: number,
    view: { landscape: Landscape; scroll: Scroll; worldScale: number },
    rect: DOMRect,
  ): { x: number; y: number } | null => {
    const columns = view.landscape.columns;
    const column = position % columns;
    const row = (position - column) / columns;
    const map = mapTileToScreen(view.landscape, { column, row }, view.scroll);
    if (map === null) {
      return null;
    }
    const px = map.x * view.worldScale;
    const py = map.y * view.worldScale;
    const sx = rect.width / canvas.width;
    const sy = rect.height / canvas.height;
    return { x: px * sx, y: py * sy };
  };

  const tileFromClient = (clientX: number, clientY: number): { position: number } | null => {
    const view = access.getView();
    if (view === undefined) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const screen = {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
    return screenToMapTile(view.landscape, screen, view.scroll, view.worldScale);
  };

  // Rebuild the marker DOM to match the current building set.
  const rebuildMarkers = (): void => {
    const world = access.getWorld();
    const present = new Set<number>();
    if (world !== undefined) {
      for (const building of world.buildings.values()) {
        present.add(building.index);
        if (markers.has(building.index)) {
          continue;
        }
        const marker = document.createElement("button");
        marker.type = "button";
        marker.dataset.buildingIndex = String(building.index);
        Object.assign(marker.style, {
          position: "absolute", width: "30px", height: "30px", marginLeft: "-15px", marginTop: "-22px",
          border: "2px solid", borderRadius: "6px", background: "rgba(0,0,0,0.05)",
          cursor: "pointer", pointerEvents: "auto", boxSizing: "border-box",
          transition: "box-shadow .1s",
        } satisfies Partial<CSSStyleDeclaration>);
        marker.addEventListener("click", (event) => {
          event.stopPropagation();
          selectBuilding(building.index);
        });
        markers.set(building.index, marker);
        overlay.append(marker);
      }
    }
    for (const [index, marker] of markers) {
      if (!present.has(index)) {
        marker.remove();
        markers.delete(index);
        if (selectedIndex === index) {
          selectedIndex = null;
          popover.style.display = "none";
        }
      }
    }
  };

  // Reposition markers + the overlay box to the live canvas rect each frame.
  const reposition = (): void => {
    if (!active) {
      return;
    }
    const view = access.getView();
    const world = access.getWorld();
    const rect = canvas.getBoundingClientRect();
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    if (view !== undefined && world !== undefined) {
      for (const [index, marker] of markers) {
        const building = world.buildings.get(index);
        if (building === undefined) {
          marker.style.display = "none";
          continue;
        }
        const pos = buildingScreenPos(building.position, view, rect);
        if (pos === null || pos.x < -40 || pos.y < -40 || pos.x > rect.width + 40 || pos.y > rect.height + 40) {
          marker.style.display = "none";
          continue;
        }
        marker.style.display = "block";
        marker.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        const color = PLAYER_COLOR[building.player % PLAYER_COLOR.length]!;
        const isSelected = index === selectedIndex;
        marker.style.borderColor = isSelected ? "#fff9e7" : color;
        marker.style.boxShadow = isSelected
          ? `0 0 0 2px ${color}, 0 0 10px ${color}`
          : building.isDone ? "none" : "inset 0 0 0 2px rgba(255,255,255,0.25)";
      }
    }
    rafHandle = requestAnimationFrame(reposition);
  };

  // ── Mutations ─────────────────────────────────────────────────────────
  const afterMutation = (): void => {
    access.requestRender();
    rebuildMarkers();
  };

  const placeFinished = (position: number, type: number, player: number): EditorBuilding | null => {
    const world = access.getWorld();
    if (world === undefined) {
      return null;
    }
    if (!world.canBuildBuilding(position, type, player)) {
      return null;
    }
    const built = world.buildBuilding(position, type, player, access.getTick());
    if (built !== null) {
      built.isDone = true;
      built.progress = 1;
    }
    return built;
  };

  const deleteBuilding = (index: number): void => {
    const world = access.getWorld();
    const building = world?.buildings.get(index);
    if (world === undefined || building === undefined) {
      return;
    }
    world.demolishBuildingAt(building.position);
    selectedIndex = null;
    popover.style.display = "none";
    afterMutation();
    showHint("Deleted. Click a building to select, or pick a type to place.");
  };

  const replaceBuilding = (index: number, type: number): void => {
    const world = access.getWorld();
    const building = world?.buildings.get(index);
    if (world === undefined || building === undefined) {
      return;
    }
    const { position, player } = building;
    world.demolishBuildingAt(position);
    const built = placeFinished(position, type, player);
    selectedIndex = built?.index ?? null;
    afterMutation();
    if (built === null) {
      showHint(`Couldn't place a ${buildingName(type)} there.`);
    } else {
      selectBuilding(built.index);
    }
  };

  const moveBuilding = (index: number, toPosition: number): void => {
    const world = access.getWorld();
    const building = world?.buildings.get(index);
    if (world === undefined || building === undefined) {
      return;
    }
    const { type, player, isDone } = building;
    if (!world.canBuildBuilding(toPosition, type, player)) {
      showHint("Can't place there — try another tile.");
      return;
    }
    world.demolishBuildingAt(building.position);
    const built = placeFinished(toPosition, type, player);
    if (built !== null) {
      built.isDone = isDone;
      built.progress = isDone ? 1 : built.progress;
    }
    mode = { kind: "idle" };
    selectedIndex = built?.index ?? null;
    afterMutation();
    syncModeUi();
    if (built !== null) {
      selectBuilding(built.index);
    }
  };

  // ── Selection UI ──────────────────────────────────────────────────────
  function selectBuilding(index: number): void {
    const world = access.getWorld();
    const building = world?.buildings.get(index);
    if (world === undefined || building === undefined) {
      return;
    }
    selectedIndex = index;
    mode = { kind: "idle" };
    syncModeUi();

    popTitle.textContent = `${buildingName(building.type)} · P${building.player + 1}${building.isDone ? "" : " · building"}`;
    popActions.replaceChildren(
      actionButton("⤳ Move", () => {
        mode = { kind: "move", index };
        popover.style.display = "none";
        syncModeUi();
      }),
      actionButton("⟳ Replace", () => openReplacePalette(index)),
      actionButton("🗑 Delete", () => deleteBuilding(index)),
    );

    const view = access.getView();
    const rect = canvas.getBoundingClientRect();
    const pos = view === undefined ? null : buildingScreenPos(building.position, view, rect);
    if (pos !== null) {
      popover.style.left = `${Math.min(rect.left + pos.x + 12, globalThis.innerWidth - 180)}px`;
      popover.style.top = `${Math.max(rect.top + pos.y - 10, 8)}px`;
    }
    popover.style.display = "block";
  }

  function openReplacePalette(index: number): void {
    popTitle.textContent = "Replace with…";
    const grid = document.createElement("div");
    Object.assign(grid.style, { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", maxHeight: "240px", overflowY: "auto" });
    for (const entry of PLACEABLE) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = titleCase(entry.label);
      Object.assign(chip.style, {
        font: "600 11px ui-sans-serif, system-ui, sans-serif", padding: "6px 4px", color: "#f2ecd8",
        background: "rgba(36,42,36,0.9)", border: "1px solid rgba(242,236,216,0.18)", borderRadius: "6px", cursor: "pointer",
      });
      chip.addEventListener("click", () => replaceBuilding(index, entry.value));
      grid.append(chip);
    }
    popActions.replaceChildren(grid);
  }

  // Reflect the current mode in the palette chips + hint.
  function syncModeUi(): void {
    for (const [value, chip] of paletteButtons) {
      styleChip(chip, mode.kind === "place" && mode.type === value);
    }
    overlay.style.pointerEvents = mode.kind === "idle" ? "none" : "auto";
    overlay.style.cursor = mode.kind === "idle" ? "default" : "crosshair";
    if (mode.kind === "place") {
      showHint(`Tap a tile to place a ${buildingName(mode.type)}. Tap the type again to cancel.`);
    } else if (mode.kind === "move") {
      showHint("Tap the destination tile. Buildings rebuild finished.");
    } else {
      showHint("Tap a building to select it, or pick a type below to place one.");
    }
  }

  // Overlay click — only fires when armed (pointer-events auto in place/move).
  overlay.addEventListener("click", (event) => {
    const tile = tileFromClient(event.clientX, event.clientY);
    if (tile === null) {
      return;
    }
    if (mode.kind === "place") {
      const player = access.getPlayer();
      const built = placeFinished(tile.position, mode.type, player);
      afterMutation();
      if (built === null) {
        showHint(`Can't place a ${buildingName(mode.type)} there — try another tile.`);
      }
    } else if (mode.kind === "move") {
      moveBuilding(mode.index, tile.position);
    }
  });

  const setActive = (next: boolean): void => {
    active = next;
    mode = { kind: "idle" };
    selectedIndex = null;
    overlay.style.display = next ? "block" : "none";
    toolbar.style.display = next ? "block" : "none";
    popover.style.display = "none";
    launcher.textContent = next ? "✕ Close editor" : "✛ Edit";
    launcher.style.borderColor = next ? "#d7c584" : "#b89f5a";
    if (next) {
      rebuildMarkers();
      syncModeUi();
      if (rafHandle === 0) {
        rafHandle = requestAnimationFrame(reposition);
      }
    } else {
      if (rafHandle !== 0) {
        cancelAnimationFrame(rafHandle);
        rafHandle = 0;
      }
    }
  };

  launcher.addEventListener("click", () => setActive(!active));

  // Esc clears the current mode, then closes the editor.
  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !active) {
      return;
    }
    if (mode.kind !== "idle" || selectedIndex !== null) {
      mode = { kind: "idle" };
      selectedIndex = null;
      popover.style.display = "none";
      syncModeUi();
    } else {
      setActive(false);
    }
  };
  globalThis.addEventListener("keydown", onKey);

  // The launcher only makes sense once a world is running; poll cheaply.
  const visibilityTimer = globalThis.setInterval(() => {
    const hasWorld = access.getWorld() !== undefined;
    launcher.style.display = hasWorld ? "block" : "none";
    if (!hasWorld && active) {
      setActive(false);
    }
  }, 500);
  launcher.style.display = access.getWorld() !== undefined ? "block" : "none";

  root.append(launcher, overlay, toolbar, popover);

  return () => {
    globalThis.clearInterval(visibilityTimer);
    globalThis.removeEventListener("keydown", onKey);
    if (rafHandle !== 0) {
      cancelAnimationFrame(rafHandle);
    }
    launcher.remove();
    overlay.remove();
    toolbar.remove();
    popover.remove();
  };
}
