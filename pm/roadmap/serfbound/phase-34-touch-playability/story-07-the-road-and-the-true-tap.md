# SB-34-07 — The Road and the True Tap

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-06
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Round 4 of the device gate (maintainer, 2026-06-11): the cursor is
visible but "sometimes does not correspond to the actual location
where I tapped"; tapping a flag or construction site offers no way
to build a road; and the road panel button "changes to a rectangle
which becomes transparent to the background and does not do
anything."

## What it turned out to be

1. **The tap picked the wrong tile on hills** — `screenToMapTile`
   ignored terrain height (a recorded simplification), while the
   cursor draws at the height-lifted apex (4px per height step, up
   to 124px). On flat ground tap and cursor agreed; on high ground
   they diverged. Picking is now height-aware: the chosen tile is
   the one whose drawn apex — the exact point the cursor renders —
   lies nearest the tap.
2. **The transparent rectangle was a phantom sprite** —
   `panelButtonId.buildRoadStarred` was 25; the reference enum ends
   at `BuildRoadStarred = 24`, and the DOS data carries exactly
   panel buttons 0..24 (verified against the maintainer's archive:
   button 25 MISSING). Arming road mode swapped the slot to a sprite
   that exists in no archive — a hole. It is 24 now, and the fixture
   carries exactly 25 buttons so a phantom id fails in CI the way it
   fails on a phone.
3. **No road act from a flag, and silence on rejection** — the
   reference turns the build slot into BuildRoad when the cursor
   stands on an own flag; Serfbound never did. Now: tap your flag →
   the build button becomes the road button → tap it → tap the
   destination flag. And every road-flow state change speaks
   through the in-canvas notice ("TAP YOUR STARTING FLAG", "TAP THE
   TARGET FLAG", "THE ROAD IS LAID", "NO ROAD - END AT A FLAG") —
   the old prompts lived in the dev ledger, which players never
   see. The castle confirm question now also speaks as a notice.

## Acceptance criteria

- [x] `mapTileToScreen` → `screenToMapTile` round-trips exactly at
  the true (height-lifted) screen point (unit-gated).
- [x] Road mode's armed button renders from real data (sprite 24;
  fixture mirrors the 25-button reality; real-data capture in
  artifacts/).
- [x] An own flag under the cursor turns the build slot into the
  road act, pre-seeded with that flag as the start (unit-gated
  mapping; flow wired in the shell).
- [x] Every road-flow state change and the castle confirm surface as
  in-canvas notices (touch spec asserts the armed-mode notice).
