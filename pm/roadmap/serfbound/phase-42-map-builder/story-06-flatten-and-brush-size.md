# SB-42-06 — Flatten and Brush Size

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-05
- **Owner:** unassigned

## Problem

The first editor cut paints terrain and nudges height ±8 over a fixed
radius-1 brush. Authoring a real map needs to **flatten** an area to a
level base (a "zero the Z" affordance) and to paint over a **bigger
area** than seven tiles at a time. (Maintainer feedback, 2026-06-13.)

## What ships

- A **Flatten** tool: sets the brush area's height to a level base
  (`MapEditor.setHeight`, which already re-clamps the ≤32 slope), so a
  click levels the ground instead of nudging it.
- An adjustable **brush size** (1 / 2 / 3): terrain, raise/lower, and
  flatten paint over the chosen radius. `applyEditorTool` takes a
  radius override; the screen tracks the active size and passes it.
- The palette renders the new tool and the size control; the active
  size shows pressed state.

## Acceptance criteria

- [x] `applyEditorTool` flattens the brush area to the tool's base and
  honours a radius override for terrain/height/flatten (CI-gated,
  stash-verified): a radius-2 stroke touches the 19-tile neighborhood,
  flatten levels them to the base, and the ≤32 slope invariant still
  holds.
- [x] The editor surface offers Flatten and the 1/2/3 size control; a
  bigger brush paints a wider area on screen (browser-gated).
- [x] Full unit + browser sweep, release, and compatibility gates green.

## Honest limits

- Flatten levels to a fixed low base; "level to the clicked tile" and
  per-tool base presets can follow if wanted. Copy/paste a rectangle is
  SB-42-07.
