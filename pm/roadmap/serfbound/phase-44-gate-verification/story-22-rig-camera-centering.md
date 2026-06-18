# SB-44-22 — Rigs Open on the Action (Camera Centering)

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-03 (the rig harness)
- **Owner:** unassigned

## Problem

Loading a rig sometimes opened the camera in the wrong place — e.g. a coastal
map where half the territory is water showed open sea instead of the
settlement. Cause: `startLandscapeRendering` always resets `currentScroll` to
the map origin `{0,0}`, and the rig/save restore path never re-centered. On a
128×128 map with the castle at the top-right corner, the origin is nowhere near
the action.

## What ships

- **Center on load.** `applyRestoredLocalGame` (the rig + saved-game restore
  path) now centers the camera on the local player's `castlePosition` (or, if
  there's no castle yet, any building). New games — no buildings — stay at the
  origin, where the player founds their castle by tapping.
- **Stagger-correct centering.** `centerScrollOnPosition` undoes the renderer's
  per-row `columnShift = (r + (r&1)) >> 1` (the same term `mapTileToScreen`
  applies) when computing the column scroll. Without it the focus landed a
  third of the screen off to one side (verified: castle x≈112 instead of the
  ≈350 center on a 700px canvas).

## freeserf.net boundary

Held. App-layer camera behavior; no engine change.

## Acceptance criteria

- [x] A rig with off-origin content opens with the settlement centered, not on
  open sea (`artifacts/cam2-phase-36-road-split.png`, `cam2-phase-38-fisher.png`).
- [x] Column centering accounts for the row stagger (debug trace confirmed the
  castle tile maps to viewport center).
- [x] Build + unit suite green (329/329).
