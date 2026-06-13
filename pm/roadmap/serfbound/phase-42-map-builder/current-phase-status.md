# Phase 42 — Map Builder (local)

**Last updated:** 2026-06-13 (SB-42-05 done: the editor is **on
screen** — "Build a map" opens it from the title, the authentic
landscape renders, the tool palette paints terrain/heights/objects/
minerals/starts, validate reports a verdict, and "Play this map" starts
a local game on the authored map. Browser-gated in real chromium plus a
CI reducer/palette gate. The builder the player was promised now
exists. Earlier: the format, brush model, placement tools, validation
and play seam).
**Status:** playable surface shipped; the on-device maintainer gate +
save-to-library/publish are the next slice.

## Goal

A fully web-driven map editor: players author custom Settlers maps in
the browser — paint terrain on the up/down-triangle/height model, place
objects, seed minerals, set each player's castle start — validate
playability live, and play them locally with zero network. The editor
**looks and works exactly like the game**: it mounts the production
sprite renderer (`landscape-scene.ts`) over the draft landscape, so the
real decoded tiles draw pixel-identical to a played map. Sharing on
serfbound.com is Phase 43.

## The asset decision that shapes the phase (maintainer, 2026-06-13)

The builder must show the **real tiles**, not schematic placeholders —
and it is **import-gated like playing**: it requires the player's own
imported `SPAU.PA` and renders with their decoded assets, rejecting
with `missing-imported-data` when absent, the same rule a generated map
obeys. It ships no original art. "Baking the tiles in" so the builder
needs no import is **Phase 31** (licensed asset delivery, hard-gated on
written rights permission, currently verbal-only) — the builder
inherits import-free use automatically when that lands; it is not a
builder-specific gate. An earlier asset-free synthetic-render idea is
dropped (decision §7.0). This keeps the feature boundary-clean today
with zero new posture. (Gallery thumbnails in Phase 43 stay sprite-free
false-color so the service touches no original art.)

## Reference / codebase ground truth

- `ClassicMapLandscape` (map-generator.ts) is six typed arrays;
  `SerfboundGameWorld`'s constructor already takes a landscape value,
  not a seed (game-world.ts) — `continueFromDosSavegame` already proves
  a hand-built landscape feeds the world. **No simulation-pipeline
  change is needed to play a custom map.**
- `landscape-scene.ts` is the production sprite renderer the editor
  reuses — the real decoded tiles, identical to the game.
- `minimapTerrainColors` (popup.ts:225) is the sprite-free render
  primitive reserved for Phase 43 gallery thumbnails (off the wire),
  not the editor.
- `canBuildCastle` (game-world.ts) is the live castle-start validator.
- `adjustMapHeight` slope clamp (≤32) and `mapSpaceFromObject` legality
  are the editor's invariants, keeping authored maps inside the space
  the engine already handles.

## Exit criteria (evidence required)

- [x] The `serfbound.custom-map` v1 format round-trips: generate →
  encode → decode → byte-identical arrays and equal
  `computeGameChecksum`; malformed payloads reject (not clamp); the
  asset-and-legal-boundary addendum lands. (SB-42-01)
- [x] The editor canvas: the MapEditor brush model writes expected
  bytes for terrain and height strokes, holds the ≤32 slope invariant,
  and undoes/redoes a stroke completely (CI-gated, asset-free). The
  authentic WebGL2 render + pointer→tile wiring ride the device gate
  (SB-42-05). (SB-42-02)
- [x] Objects, minerals, and per-player castle starts place legally
  (the engine's space rule + live `canBuildCastle`), illegal
  placements refused. (SB-42-03 — the editor UI feedback rides the
  device gate; the engine legality is CI-held.)
- [x] Validation (castle-placeable, buildable ratio, named errors,
  advisory buildable-nearby) + "play this map" into a local game to a
  founded castle via the customMap seam. (SB-42-04 — the validity
  strip UI rides the device gate; the verdict and play seam are
  CI-held.)
- [x] The editor on screen: **Build a map** opens the editor from the
  title screen, the authentic landscape renders, the tool palette
  paints terrain/heights/objects/minerals/starts, validate reports a
  verdict, and **Play this map** starts a local game on the authored
  map. (SB-42-05 — the reducer + palette + play seam are CI-held; the
  reachable surface + authentic render + paint + play are browser-gated
  in real chromium.)
- [ ] On-device: the maintainer authors a real map on a real device
  (touch + desktop), and saving to the on-device library + publishing
  to the gallery is the next slice. (maintainer device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-42-01 | The format and the boundary | done | story-01-the-format-and-the-boundary.md | evidence-story-01.md |
| SB-42-02 | The editor canvas (authentic render) | done | story-02-the-editor-canvas.md | evidence-story-02.md |
| SB-42-03 | Objects, minerals, starts | done | story-03-objects-minerals-starts.md | evidence-story-03.md |
| SB-42-04 | Validation and play-local | done | story-04-validation-and-play-local.md | evidence-story-04.md |
| SB-42-05 | The editor on screen | done | story-05-the-editor-on-screen.md | evidence-story-05.md |
| SB-42-06 | Flatten and brush size | done | story-06-flatten-and-brush-size.md | evidence-story-06.md |
| SB-42-07 | Copy and paste a region | backlog | — | — |

## Boundaries

- Sharing, the maps service, and multiplayer-on-custom-maps are
  Phase 43 — this phase is local-only, honoring serverless-play-first.
- The editor is import-gated like playing (real tiles from the
  player's own `SPAU.PA`); shipping assets so it needs no import is
  Phase 31, inherited automatically when that written-permission gate
  lands.
