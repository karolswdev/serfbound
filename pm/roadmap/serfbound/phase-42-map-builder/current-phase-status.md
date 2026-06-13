# Phase 42 — Map Builder (local)

**Last updated:** 2026-06-13 (SB-42-02 done: the MapEditor brush model
turns terrain and height strokes into landscape bytes, holds the
generator's ≤32 slope invariant (a cliff-sized delta cascades smooth),
and reverses any stroke completely with undo/redo; toLandscape()
round-trips through the SB-42-01 format. The authentic render + pointer
wiring ride the device gate. Earlier: SB-42-01, the format).
**Status:** in progress.

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
- [ ] Objects, minerals, and per-player castle starts place legally
  (live `canBuildCastle`), illegal placements refused with located
  feedback. (SB-42-03)
- [ ] Validation strip (castle-placeable, buildable ratio,
  reachability, advisory balance) + "play this map" into a local game
  to a founded castle, all asset-gated only at play. (SB-42-04)
- [ ] On-device: the maintainer authors a real map on a real device
  (touch + desktop), plays it, saves and reloads it. (SB-42-05, the
  device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-42-01 | The format and the boundary | done | story-01-the-format-and-the-boundary.md | evidence-story-01.md |
| SB-42-02 | The editor canvas (authentic render) | done | story-02-the-editor-canvas.md | evidence-story-02.md |
| SB-42-03 | Objects, minerals, starts | backlog | — | — |
| SB-42-04 | Validation and play-local | backlog | — | — |
| SB-42-05 | The device gate | backlog | — | — |

## Boundaries

- Sharing, the maps service, and multiplayer-on-custom-maps are
  Phase 43 — this phase is local-only, honoring serverless-play-first.
- The editor is import-gated like playing (real tiles from the
  player's own `SPAU.PA`); shipping assets so it needs no import is
  Phase 31, inherited automatically when that written-permission gate
  lands.
