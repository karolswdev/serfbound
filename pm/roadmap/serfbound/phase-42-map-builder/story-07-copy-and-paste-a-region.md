# SB-42-07 — Copy and Paste a Region

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-05, SB-42-06
- **Owner:** unassigned

## Problem

Authoring repeats: a bay, a mountain ridge, a balanced starting nook
you want mirrored for each player. Painting each by hand is slow.
The editor needs **copy a rectangle, paste it elsewhere**. (Maintainer
feedback, 2026-06-13.)

## What ships

- `MapEditor.copyRegion(cornerA, cornerB)` → `MapRegionClip`: lifts the
  inclusive column/row rectangle between two tiles — all six arrays, so
  the clip carries terrain, height, objects, and minerals exactly.
- `MapEditor.pasteRegion(clip, target)`: writes the clip with `target`
  as its top-left corner, as **one undoable stroke**, then re-clamps the
  ≤32 slope; the destination wraps on the toroidal map so an edge paste
  never writes out of bounds.
- The editor surface: **Copy region** (click two corners) and **Paste**
  (click a destination) buttons, a small click-sequence machine over
  painting, with status prompts at each step.

## Acceptance criteria

- [x] `copyRegion` captures a rectangle's six arrays and `pasteRegion`
  reproduces them at the target as one undoable stroke that the slope
  clamp keeps valid (CI-gated, stash-verified).
- [x] On screen: Copy region → two corner clicks → Paste → a
  destination click, each prompting in the status (browser-gated).
- [x] Full unit + browser sweep, release, and compatibility gates green.

## Honest limits

- Axis-aligned rectangle by the raw bounding box (no toroidal-shortest
  selection); paste overwrites (no blend). A visible marquee/preview of
  the selection is a polish follow-up.
