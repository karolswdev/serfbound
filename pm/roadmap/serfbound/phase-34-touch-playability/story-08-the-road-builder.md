# SB-34-08 — The Road Builder

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-07
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

The maintainer, round 5: "we're missing one very crucial thing in
the entire interface, which is the road builder interface, which
allowed us to build roads, plant flags, and so on with a very simple
and intuitive menu." Correct — Serfbound only had a bare two-tap
flag-to-flag dispatch; the original's road-building mode (the
reference Viewport/PanelBar `IsBuildingRoad` flow) was never ported.

## What shipped (the reference flow, touch-first)

- **Entering**: tap your flag → the build slot becomes the road
  button → tap it; or arm the road slot and tap your starting flag.
- **While building, the panel IS the road builder** (reference
  IsBuildingRoad layout): the starred road button in slot 0 cancels;
  every other slot is inert.
- **Extending**: tap anywhere — the path extends toward the tap
  (pathfound, like the reference's click-to-extend), drawn on the
  map with the real road-segment sprites as a live preview.
- **Undo**: tap the previous tile — the last leg comes back off.
- **Planting a flag**: tap the path's end — a flag rises there and
  the road is laid (the reference's signature act).
- **Reaching a flag**: extend onto any of your flags — the road
  completes to it.
- Every step speaks on canvas: "TAP TO EXTEND THE ROAD", "TAP THE
  END TO RAISE A FLAG", "NO PATH THAT WAY", "THE ROAD IS LAID".

The engine honors the drawn path: `game.build-road` accepts explicit
`directions` (validated by the world like any road) instead of
re-pathfinding over the player's intent.

## Acceptance criteria

- [x] An explicit drawn path builds exactly as drawn, segment for
  segment, and an invalid drawn path rejects wholesale (engine-gated).
- [x] The in-progress path renders with real segment sprites
  (unit-gated; real-data capture in artifacts/).
- [x] The road-builder bar follows the reference layout and the
  starred slot cancels (unit + browser gated).
- [x] The full flow — tap flag, extend, plant a flag, road laid —
  passes under genuine touch at DPR 3 (touch-suite gated; real-data
  run reproduces it end to end).
