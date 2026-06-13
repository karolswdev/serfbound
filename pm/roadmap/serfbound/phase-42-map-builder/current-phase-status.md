# Phase 42 — Map Builder (local)

**Last updated:** 2026-06-13 (scaffolded from the map-builder design
canon; see
pm/roadmap/serfbound/adoption/map-builder-and-community-maps-decision.md).
**Status:** scaffolded.

## Goal

A fully web-driven map editor: players author custom Settlers maps in
the browser — paint terrain on the up/down-triangle/height model, place
objects, seed minerals, set each player's castle start — validate
playability live, and play them locally with zero network. The editor
is a **tool, not the game**: it renders **synthetically** (false-color
terrain + geometric object markers, the existing `minimapTerrainColors`)
and needs **no imported game data and no account**. Original assets are
required only to play a map in the authentic sprite render — exactly
today's rule. Sharing on serfbound.com is Phase 43.

## The pivot that shapes the phase (maintainer, 2026-06-13)

"The map builder should totally be usable without even providing
[SPAU.PA]. That's not a game… that's a tool." The whole phase honors
this: every editor surface is asset-free synthetic rendering; the
authentic sprite scene is touched only at play time. This resolves the
asset-boundary question by construction (decision §7.0) — accepted as
engineering policy, no written rights gate.

## Reference / codebase ground truth

- `ClassicMapLandscape` (map-generator.ts) is six typed arrays;
  `SerfboundGameWorld`'s constructor already takes a landscape value,
  not a seed (game-world.ts) — `continueFromDosSavegame` already proves
  a hand-built landscape feeds the world. **No simulation-pipeline
  change is needed to play a custom map.**
- `minimapTerrainColors` (popup.ts:225) is the asset-free render
  primitive: one solid color per `mapTerrain` value.
- `canBuildCastle` (game-world.ts) is the live castle-start validator.
- `adjustMapHeight` slope clamp (≤32) and `mapSpaceFromObject` legality
  are the editor's invariants, keeping authored maps inside the space
  the engine already handles.

## Exit criteria (evidence required)

- [ ] The `serfbound.custom-map` v1 format round-trips: generate →
  encode → decode → byte-identical arrays and equal
  `computeGameChecksum`; malformed payloads reject (not clamp); the
  asset-and-legal-boundary addendum lands. (SB-42-01)
- [ ] The synthetic editor canvas: with ZERO imported assets, paint
  terrain and heights and see the synthetic scene update; a stroke
  writes the expected bytes. (SB-42-02)
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
| SB-42-01 | The format and the boundary | backlog | — | — |
| SB-42-02 | The synthetic editor canvas | backlog | — | — |
| SB-42-03 | Objects, minerals, starts | backlog | — | — |
| SB-42-04 | Validation and play-local | backlog | — | — |
| SB-42-05 | The device gate | backlog | — | — |

## Boundaries

- Sharing, the maps service, and multiplayer-on-custom-maps are
  Phase 43 — this phase is local-only, honoring serverless-play-first.
- The authentic sprite preview in the editor (for players who DO have
  imported data) is an optional enhancement; the tool's default and
  every gate run asset-free.
