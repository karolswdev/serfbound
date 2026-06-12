# SB-36-05 — Stock and Priorities

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-02
- **Unblocks:** SB-36-06, SB-36-07
- **Owner:** unassigned

## Problem

The audit's row 10. The reference gives every operating building
typed stock slots (the worker's InitBuilding: maximum 8 per input)
and recomputes a priority for each on every update —
`policy >> (8 + total)` where the policy is a player distribution
setting (food favors the gold mine, wheat favors the pig farm, coal
favors the gold smelter) and `total` is everything delivered or in
flight, or `0xff >> total` for the always-hungry inputs (the
sawmill's lumber, the baker's flour). Inventories dispatch to the
highest priority above a threshold of 16; the unknown-destination
search routes to the highest-priority wanting building. Serfbound
instead serves consumers first-found with a flat in-flight cap of 4:
a steel smelter built before a gold smelter starves it of coal
forever, whatever the player's economy needs.

## Reference ground truth

- Serf.cs InitBuilding (5243–5254) + call sites (5376–5620): the
  stock book — which inputs each profession's building stocks,
  maximum 8.
- Building.cs Update (1509–1736): the per-type priority policies and
  the `policy >> (8 + total)` / `0xff >> total` decay; priority 0 at
  the slot maximum.
- Player.cs Reset*Priority (314–358): the distribution defaults —
  food 13100/45850/45850/65500 to the four mines, planks 3275/19650
  to boatbuilder/toolmaker, steel 45850/65500, coal
  32750/65500/52400, wheat 65500/32750.
- Game.cs UpdateInventories (2267+): inventories serve the
  max-priority building above minimum 16.
- Flag.cs ScheduleUnknownDestinationCallback (1482–1502): unknown
  destinations rank by building priority, early exit above 204.

## What ships

- The stock book as engine data: per-building-type slot specs
  {resources, maximum 8, policy} with the reference distribution
  defaults (SB-36-07 makes the policies player data).
- `#stockPriority(building, product)`: the reference decay formula,
  GroupFood totals for the mines, zero at the maximum.
- Priority-ranked dispatch in all three routing paths: production
  output, inventory exports (threshold 16), and SB-36-02's
  unknown-destination re-homing (early exit above 204) — replacing
  every first-found scan and the flat cap of 4. Ties break to the
  lower building index (deterministic).
- Three congestion mechanics the priority traffic forced out of the
  reference, all earned by gridlocks in the chain suites:
  - Inventory.IsQueueFull — at most two outbound resources staged
    behind the inventory door;
  - TransporterMoveToFlag's resource switch — a loaded carrier at a
    full flag exchanges cargo with the highest-priority slot
    scheduled back over its own road;
  - the unconditional ChangeDirection — a carrier that can neither
    deliver nor swap walks back across its road with the cargo in
    hand instead of parking on the flag tile, where it would block
    the very transporters that must drain the flag.

## Acceptance criteria

- [x] With coal in the castle and both smelters empty, the first
  coal goes to the GOLD smelter (65500 over 32750), and the decay
  alternates deliveries 2/2 instead of first-found 4/0
  (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- Stocks stay stored in the deliveredResources/requestedResources
  records (available ≡ delivered, requested ≡ in flight); the
  reference's Stock struct shape is bookkeeping, the priorities and
  maxima are behavior — recorded.
- Military gold keeps the cap-based dispatch (the reference
  initializes the gold slot without an Update priority policy).
- Construction material flows and the castle's plank/stone reserve
  are untouched; the emergency program is SB-36-08.
- Priority gates on `isDone` rather than the reference's Holder bit
  (serfbound auto-staffs completed buildings; the typed-serf
  dispatch is Phase 38).
