# SB-44-18 — God-Mode Building Editor

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-03 (the rig harness + live-world handle)
- **Owner:** unassigned

## Problem

The debug tools were too limited to set up or repair a scene by hand. The
maintainer wanted a "select mode" that highlights every building and lets you
move it, delete it, or replace it with another type — and place new ones —
right on the live map, so rigs and edge cases can be staged without code.

## What ships

- **`packages/app/src/building-editor.ts`** — a self-contained dev overlay. It
  does its own screen↔tile picking above the canvas (`mapTileToScreen` /
  `screenToMapTile` × `effectiveWorldScale`) and mutates the live world
  directly (`buildBuilding` / `demolishBuildingAt` / `canBuildBuilding`), so
  the app layer only hands it the existing world + view handles (one
  `mountBuildingEditor(...)` call in main.ts).
- **Select mode.** A launcher (✛ Edit) toggles it; every building gets a
  player-colored marker (dashed = under construction). Click to select →
  popover with **Move** (pick a destination tile), **Replace** (type palette
  swaps it in place), **Delete** (demolish).
- **Place mode.** A palette of all 24 building types; arm one, tap a tile, it
  drops a finished building. Esc cancels the mode, then closes the editor.
- **Dev-gated.** Only available under `?rig=` or `?dev=1` — never shows in a
  normal player's game.

## Known limits (god-mode, not a real relocation)

- "Move" is demolish + rebuild — resources/garrison don't migrate.
- Deleting a castle defeats that player (engine rule). No confirm yet.
- Edits are direct mutations, not recorded actions, so they don't persist into
  a rig snapshot.

## freeserf.net boundary

Held. App-layer dev tooling; no engine changes, no upstream code.

## Acceptance criteria

- [x] Every building is highlighted and selectable; the popover offers Move /
  Replace / Delete (`artifacts/editor-select.png`).
- [x] Placement works end-to-end on real data — building count rises on a
  valid tile (`artifacts/editor-placed.png`; 2→3 verified).
- [x] Dev-gated (`?rig`/`?dev`); build + unit suite green (329/329).
