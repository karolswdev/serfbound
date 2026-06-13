# Evidence — SB-42-02 — The Editor Canvas

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/map-editor.ts` (new) — `MapEditor` over a
  mutable copy of a `ClassicMapLandscape`:
  - `paintTerrain(position, terrain, radius)` sets both triangles'
    type across the spiral brush neighborhood, refusing out-of-range
    enums;
  - `raiseHeight`/`setHeight(position, …, radius)` edit heights then
    re-clamp the ≤32 slope invariant locally (`adjustMapHeight` as a
    worklist to a fixpoint, seeded at the stroke);
  - grouped strokes (`beginStroke`/`endStroke`) and an undo/redo ring
    that records every byte change — slope cascades included — so undo
    reverses a stroke completely;
  - `toLandscape()` hands the authored landscape to SB-42-01's encode
    and the play pipeline.
- `packages/engine/src/index.ts` — re-exports `MapEditor`.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (the module does not
exist; the suite cannot import):
  engine-map-editor: # pass 0 / fail 1 (stashed with -u)
post-fix:
  ok 1 - a terrain stroke writes the expected typesUp/typesDown bytes
         at the tile and across a radius-1 ring; out-of-range terrain
         is refused.
  ok 2 - raising a tile by a cliff-sized 90 leaves NO adjacency on the
         whole map over 32 (the clamp cascades), and the first ring
         sits exactly 32 below the peak.
  ok 3 - undo restores every byte a radius-1 height cliff (and its
         cascade) touched, byte-for-byte; redo re-applies it.
  ok 4 - toLandscape() → encodeCustomMap → decode round-trips all six
         arrays byte-identically (ties the editor to the SB-42-01
         format).
  engine-map-editor: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] A terrain stroke writes the expected bytes across its radius
  (engine-gated, stash-verified).
- [x] A height stroke holds the ≤32 slope invariant; a big delta
  cascades (engine-gated).
- [x] Undo reverses a stroke completely (cascade included); redo
  re-applies; `toLandscape()` round-trips (engine-gated).
- [x] Full unit sweep + release gates green.

## Note

The authentic WebGL2 render and pointer→tile wiring (the editor
mounting `landscape-scene` over the live landscape with real tiles)
are the app glue proven on-device at SB-42-05; this story is the
CI-held brush engine.
