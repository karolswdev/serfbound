# Evidence — SB-42-05 — The Editor on Screen

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/editor-screen.ts` (new) — `editorTools` (the
  palette), `findEditorTool`, the pure `applyEditorTool` reducer,
  `newEditableLandscape`, `editorToCustomMap`, and the `MapEditorScreen`
  controller (owns a `MapEditor`, renders `toLandscape()` through the
  authentic `buildLandscapeRenderAssets` + `createLandscapeScene`, maps
  pointer clicks via `screenToMapTile`, drives the palette + verdict,
  hands an `encodeCustomMap` record to "Play this map").
- `packages/app/src/main.ts` — the **Build a map** entry (enabled once
  data is imported), the `editor` chrome state + the open/play/validate/
  exit wiring, `customMap` threaded into `startGameNow`, the shared
  canvas's game pointer + scene loop yielding while the editor is open,
  and `export * from "./editor-screen.js"`.
- `packages/app/src/styles.css` — the editor surface / palette styling.
- `tests/ci/app-editor-screen.test.mjs` (new) — the reducer + palette +
  play gate.
- `tests/browser/map-editor.spec.ts` (new) — the reachability/device gate.

## Verification artifacts

```
CI gate, stash-verified failing pre-fix (revert tracked changes, keep
the new module+test, rebuild app — the export is absent):
  SyntaxError: '@serfbound/app' does not provide an export named
  'applyEditorTool'  → # pass 0 / fail 1
post-fix:
  ok 1 - the palette covers terrain, height, objects, minerals, fish,
         and four starts
  ok 2 - applyEditorTool dispatches every tool through the editor
  ok 3 - a start tool sets a castle-placeable start; play this map runs it
  ok 4 - a start at a blocked site is refused, not forced
  app-editor-screen: # tests 4 / pass 4

browser gate (real chromium, decodable fixture, no real SPAU.PA):
  the map editor opens, paints the authentic landscape, and plays — 1 passed
  (asserts chrome=editor, the palette + actions visible, scene-mode
  "landscape" with sprite-count > 100, a paint flips aria-pressed and
  updates the verdict, exit returns to title)

npm test            -> exit=0 (unit + build + 33 browser specs)
npm run ci:release  -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] `applyEditorTool` applies every palette tool, and an edited map
  encodes and plays in a local game (CI-gated, stash-verified).
- [x] The editor is reachable, renders the authentic landscape, paints,
  and plays (browser-gated).
- [x] Full unit + browser sweep + release + compatibility green.

## Note

First cut of the surface: paint terrain/heights, place objects/minerals/
starts, validate, and play. Saving to the on-device library and
publishing to the gallery (the SB-43 client is already CI-held) is the
next slice. The render is import-gated and authentic — the editor uses
the player's own decoded data to show the real tiles, never synthetic
ones.
