# Evidence — SB-36-07 — The Priority Book

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `PlayerEconomySettings` +
  `defaultEconomySettings()`: flag priorities, inventory priorities,
  tool priorities, the 14 distribution splits — the
  Player.Reset*Priority defaults, one book per WorldPlayer.
- `packages/engine/src/inventory.ts` — `resourceMode: in|stop|out`
  on WorldInventory (default in).
- `packages/engine/src/serfs.ts` —
  - the hardcoded flag-priority constant is dead; pickup and the
    cargo swap read the owner's book (`#flagPriority`);
  - `buildingStockSpecs` policies are distribution KEYS resolved
    through the owner's book in `#stockPriority`;
  - the toolmaker round-robin is dead; `#drawTool` ports the
    reference weighted draw on the shared RNG (uniform fallback for
    an all-zero book);
  - the export sweep: In and Stop inventories serve demand
    (reference `In || Stop` sourcing); an Out inventory expels its
    highest inventory-priority resource with destination 0 and the
    flag network re-homes it;
  - acceptance: only In-mode inventories take new routings
    (`#inventoryAcceptsAtFlag` in the unknown-destination fallback,
    mode check in the production fallback).

## Verification artifacts

```
engine gates (new), stash-verified failing pre-fix (4/4):
  not ok 16..19 (# pass 15 / fail 4 with engine changes stashed)
post-fix:
  ok 16 - inverting the player's flag priorities inverts pickup:
          gold ore rides before plank in the SB-36-02 scenario
  ok 17 - zeroing coalGoldsmelter starves the gold smelter: all
          three coal to the steel smelter (three, because the
          fourth's decayed priority 15 falls under the reference
          export minimum of 16 — the threshold doing its job)
  ok 18 - modes: a stopped inventory still serves demand (the
          reference's In || Stop sourcing) but accepts nothing; an
          orphan re-homes only after flipping to In; Out expels
          lumber (priority 7) before wheat (1)
  ok 19 - a book with only the hammer prioritized draws hammers,
          three for three
  engine-serfs: # tests 19 / pass 19
  engine-economy-chains: # tests 6 / pass 6

npm test -> exit=0 (unit + build + 32 browser specs; lockstep
  checksums hold with the toolmaker on the shared RNG)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Flag priorities are player data (engine-gated, stash-verified).
- [x] Distribution splits are player data (engine-gated).
- [x] Modes: stop serves/rejects, in accepts, out expels by
  inventory priority (engine-gated).
- [x] Tool priorities drive the draw (engine-gated).
- [x] Full unit sweep + release gates green.
