# SB-42-02 — The Editor Canvas

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-01
- **Unblocks:** SB-42-03, SB-42-04
- **Owner:** unassigned

## Problem

Authoring needs a model that turns brush strokes into landscape bytes,
respecting the generator's own invariants so authored maps stay inside
the space the engine already handles — and an undo history, because no
one paints a map without mistakes. The render is the production sprite
scene (real tiles, identical to the game, import-gated); the load-
bearing, CI-gateable part is the **brush engine**: a stroke must write
exactly the right bytes, the height brush must keep the ≤32 slope
invariant the generator enforces, and undo must reverse a stroke
completely — including any slope cascade.

## Codebase ground truth

- `adjustMapHeight` (map-generator.ts): adjacent heights may differ by
  at most 32; a violation pulls the neighbor to exactly 32 from the
  edited tile, iterated to a fixpoint. The editor re-clamps locally
  after a height stroke, the same rule.
- `MapGeometry.move` (index.ts) gives the six neighbor directions for
  the local clamp and brush radius.
- `ClassicMapLandscape` is the editor's working state; `toLandscape()`
  hands it to SB-42-01's `encodeCustomMap` and the play pipeline.

## What ships

- `packages/engine/src/map-editor.ts`: a `MapEditor` over a mutable
  landscape with `paintTerrain(position, terrain, radius)` (sets the
  up/down triangle types across the spiral neighborhood) and
  `raiseHeight`/`setHeight(position, …, radius)` (edits heights then
  re-clamps the ≤32 slope locally to a fixpoint), grouped strokes, an
  undo/redo ring that records every byte change (clamp cascades
  included), and `toLandscape()`.
- The app mounts the production `landscape-scene` over the editor's
  live landscape (real tiles, import-gated) — validated on-device at
  SB-42-05; the brush bytes are the CI gate here.

## Acceptance criteria

- [x] A terrain stroke writes the expected `typesUp`/`typesDown` bytes
  at the position and across its radius (engine-gated, stash-verified).
- [x] A height stroke changes the tile and the local re-clamp keeps
  every adjacency within 32 — a big delta cascades smoothly, never a
  cliff (engine-gated).
- [x] Undo reverses a stroke completely (including a slope cascade);
  redo re-applies it; `toLandscape()` round-trips through SB-42-01's
  encode (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Object/mineral/start tools and the validity strip are SB-42-03/04;
  this story is terrain + height + undo.
- The authentic WebGL2 render and pointer→tile wiring are the app
  glue proven at the device gate (SB-42-05); the engine brush model is
  what CI holds.
- The slope re-clamp is a local worklist to the ≤32 fixpoint, not a
  global sweep — equivalent invariant, cheaper per stroke (recorded).
