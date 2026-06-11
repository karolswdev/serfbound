# Evidence — SB-36-01 — Out the Castle Door

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `dropResourceOut` (state 17, the reference DropResourceOut);
  - `#dispatchResourceOut` replaces the teleporting
    `#drainPendingOut`: an idle stock serf (or one from the pool)
    takes `pendingOut[0]`, slides out the castle door carrying it,
    and `#handleDropResourceOut` sets it down at the flag and walks
    him back inside (`#enterBuilding` → idleInStock, rejoining the
    callable pool);
  - one-carrier-at-a-time dispatch gate (flag tile + carriers
    mid-slide) and the take-it-back-inside rule on a full flag —
    both born from the mine-suite freeze (four carriers crowding
    the flag walled off the transporters; slots never drained;
    economy dead at tick 200k, castle flag permanently full);
  - the carrying torsos apply to dropResourceOut and the leave
    slide, so the plank is visibly in the carrier's arms.

## Verification artifacts

```
engine gate (new): "resources leave the castle in a serf's arms"
  - a serf in dropResourceOut with carriedResource >= 0 must stand
    at the castle flag, and the FIRST resource to appear in the
    flag's slots must have been carried there
  - on the teleport drain (stash-verified): FAILS
  - with carriers: PASSES
diagnosis trail: carrier crowding froze the mine suite ->
  serialized dispatch + requeue-inside; chains/mines/AI green after
npm run test:unit -> exit=0
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

The reference's WaitForResourceOut queue (multiple carriers staged
INSIDE with the 2-slot OutQueue semantics) is condensed to
one-carrier-at-a-time over the pendingOut list. Carriers serve the
castle; stocks/warehouses ride the same path when they exist.

## Acceptance criteria — re-checked

- [x] Carried, never materialized (gated, discriminating).
- [x] Carrying torsos on the way out.
- [x] Full sweep green.
