# Evidence — SB-36-05 — Stock and Priorities

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `buildingStockSpecs`: the stock book — per-building-type slots
    from the worker's InitBuilding calls (maximum 8), with the
    Player.Reset*Priority distribution defaults (food
    13100/45850/45850/65500 to the four mines, wheat 65500 pig farm /
    32750 mill, coal 32750/52400/65500, planks 3275/19650, steel
    45850/65500) and the always-hungry `0xff >> total` inputs;
  - `#stockPriority`: `policy >> (8 + total)` decay over delivered +
    in-flight, GroupFood totals for mines, zero at the maximum;
  - `#bestConsumerFor`: priority-ranked consumer pick (deterministic
    lower-index tie-break, military gold stays cap-based) used by
    production routing, by `#sweepInventoryExports` (reference
    minimum 16), and via the same ranking with early exit above 204
    in `#scheduleSlotToUnknownDestination`;
  - Inventory.IsQueueFull: at most 2 staged outbound per inventory;
  - `#swapCargoAtFlag` + `#roadEndAt`/`#roadOtherEnd`: the
    TransporterMoveToFlag resource switch, and the walk-back —
    a loaded carrier that can neither deliver nor swap leaves the
    flag tile and returns, instead of squatting it.

## The two gridlocks the chain suites forced out

1. First cut: the full mine-smelter-toolmaker chain froze at tick
   ~200k — the castle flag's eight slots all held outbound exports,
   four coal carriers stood waiting to hand over, and the
   transporters that should drain the flag were the waiting carriers
   themselves. The reference's 2-slot OutQueue and the cargo swap
   broke it.
2. Second cut: the twelve-building settlement froze — a carrier with
   undeliverable cargo parked ON the castle flag tile, physically
   blocking every fetcher behind it (serf 9 in the trace: standing on
   flag 1, carrying lumber, nothing scheduled its way). The
   reference's unconditional ChangeDirection (walk back loaded) broke
   that one.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 15 - stocks request by the reference priorities, not
              first-found (SB-36-05)   (# pass 14 / fail 1 stashed)
post-fix:
  ok 15 - steel smelter built first, gold smelter second: the first
          coal request lands at the GOLD smelter (policy 65500 over
          32750); the decay alternates four coal 2/2 across both —
          first-found served 4/0 to the steel smelter.
  engine-serfs: # tests 15 / pass 15
  engine-economy-chains: # tests 6 / pass 6 (including the
    twelve-building no-deadlock soak that caught both gridlocks)

npm test -> exit=0 (unit + build + 32 browser specs passed)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Priority dispatch with reference policies and decay
  (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
