# Evidence — SB-42-03 — Objects, Minerals, Starts

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/map-editor.ts` — `MapEditor` gains:
  - `canPlaceObject`/`placeObject`/`eraseObject` — the authorable
    palette only (trees/pines/palms/stones/sandstone/cross/cactus/dead
    tree + water trees/stones), water objects gated to water tiles and
    land objects to land tiles; runtime objects (flags, buildings,
    stubs, felled, seeds, signs) refused;
  - `seedMineral(position, mineral, amount)` (gold/iron/coal/stone,
    hidden so any tile) and `seedFish(position, amount)` (water only) —
    writing `minerals`/`resourceAmounts`, all through the undo ring;
  - `setStart`/`clearStart`/`starts` and `isCastlePlaceable` — the
    latter builds a scratch `SerfboundGameWorld` from `toLandscape()`
    and asks the game's own `canBuildCastle`, so a start is validated
    by the exact rule the game founds a castle with.

## Verification artifacts

```
engine gates (new), the three stash-verified failing pre-fix (the
methods do not exist):
  not ok - objects respect the space rule
  not ok - minerals and fish write the right bytes
  not ok - castle starts validate live and round-trip
  (# pass 0 / fail 3 with the editor methods stashed)
post-fix:
  ok - a land tree places on land, refuses on water; a water tree the
       reverse; a castle (non-authorable) refused outright; erase
       always works.
  ok - a coal seam writes minerals 3 + amount 12; an out-of-range
       mineral refused; fish write mineral none + amount in water,
       refused on dry land.
  ok - a legal start on the flat plateau is accepted (and rides into
       encodeCustomMap's starts); a start on a stone-blocked tile is
       refused by the live canBuildCastle; the landscape still decodes
       clean.
  engine-map-editor: # tests 7 / pass 7

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Object placement respects the engine's space rule; non-authorable
  values refused (engine-gated, stash-verified).
- [x] Minerals/fish write the expected bytes; fish refuse land
  (engine-gated).
- [x] Starts validate live via `canBuildCastle` and round-trip through
  the format (engine-gated).
- [x] Full unit sweep + release gates green.
