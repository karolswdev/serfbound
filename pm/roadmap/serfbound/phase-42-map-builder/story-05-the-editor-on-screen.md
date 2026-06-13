# SB-42-05 — The Editor on Screen

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-02, SB-42-03, SB-42-04, SB-10 (authentic render)
- **Unblocks:** SB-43-05
- **Owner:** unassigned

## Problem

The map builder shipped as engine code — `MapEditor` paints terrain and
heights, places objects/minerals/starts, validates, and exports a
playable map — but there has never been a way to *reach* it. `main.ts`
doesn't even import `MapEditor`. The builder the player was promised
does not exist on screen. This story makes it real: an on-screen editor
the player opens, paints on with the authentic tiles, validates, and
plays.

## What ships

- `packages/app/src/editor-screen.ts`: the editor surface.
  - `editorTools` — the palette (terrain by family, height ±, objects,
    erase, minerals, fish, place/clear start) and `applyEditorTool`, a
    pure reducer that applies a tool at a map position through the
    `MapEditor` (CI-gated).
  - `MapEditorScreen` — the controller: owns a `MapEditor`, renders its
    `toLandscape()` through the **authentic** landscape renderer
    (`buildLandscapeRenderAssets` + `createLandscapeScene`, import-gated
    — the real tiles, never synthetic), maps pointer clicks to tiles
    (`screenToMapTile`), drives the palette + validate readout, and
    hands an `encodeCustomMap` record to "Play this map".
- `packages/app/src/main.ts`: a **Build a map** entry on the title
  screen (shown once data is imported, since the render is import-gated),
  an editor chrome state, and the open/play/exit wiring.
- Styling for the editor palette and the `chrome="editor"` surface.

## Acceptance criteria

- [x] `applyEditorTool` applies every palette tool at a position through
  the `MapEditor` and a generated → edited → `encodeCustomMap` record
  plays in a local game (CI-gated, stash-verified).
- [x] The editor is reachable: from the title screen, **Build a map**
  opens the editor, the authentic landscape renders, a paint changes
  the map, and **Play this map** starts a local game on it
  (browser-gated).
- [x] Full unit + browser sweep, release, and compatibility gates green.

## Honest limits

- First cut of the surface: paint terrain/heights, place objects/
  minerals/starts, validate, and play. Saving to the on-device library
  and publishing to the gallery (the SB-43 client is already CI-held)
  is the next slice.
- The render is import-gated and authentic by design: the editor needs
  the player's own decoded data to show the real tiles, exactly like
  the game. No synthetic tiles, ever.
