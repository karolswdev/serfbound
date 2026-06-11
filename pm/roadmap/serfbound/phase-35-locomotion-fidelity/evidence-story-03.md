# Evidence — SB-35-03 — The Working Pose

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - staged logging: stage index in `walkingWaitCounter` (free while
    working), per-stage counters, animation 116+stage, the felled
    object laid per stage with the pine/tree family held through the
    fall (the live object is gone after stage 0 — the family derives
    from the felled value too, a bug the first cut caught);
  - stonecutting: one cut per visit (animation 123), the pile
    decrements one slice (Stone0..7 → none on the last);
  - free-walkers route AROUND standing serfs (a walker waiting
    behind a chopper dwelling hundreds of ticks waited forever —
    found by the chain suite);
  - `#sweepInventoryExports` (the reference InventoryScheduleCounter,
    minimal bridge): every 64 ticks, banked inventory stock with a
    reachable wanting consumer is pushed back out via pendingOut;
    planks/stones keep a 2-unit construction reserve. Found because
    the chain suite showed wheat 13 / flour 3 / bread 1 entombed in
    the castle while mill, baker, and miners starved — products
    emitted before their consumer existed banked forever.
- `tests/ci/engine-economy-chains.test.mjs` — horizon calibrated to
  staged pacing (6M ticks); the bread latch counts en-route
  (requested) as well as delivered — a hungry miner eats the loaf
  the same update it arrives, so sampling delivered alone races
  consumption.
- `tests/ci/engine-military-supply.test.mjs` — the exact-pairs
  forging test empties the castle's own coal/steel first so the
  re-export sweep cannot feed the smith extra pairs.

## Verification artifacts

```
engine gate (new): "the tree falls in visible stages under the axe"
  - a real lumberjack's target must pass >= 2 felled stages
    (93..102) and end as the lying trunk (97/102) — never
    tree -> gone in one step
diagnosis trail (the chain suite, three rounds):
  1. walkers wedged forever behind dwelling choppers -> route-around
  2. wheat/flour/bread entombed in the castle (13/3/1) -> the
     re-export sweep; tools jumped 1 -> 7, wheat/flour/bread -> 0
  3. bread latch raced same-update consumption -> latch on requested
npm run test:unit -> exit=0, all suites green
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

Interim stage durations at one quarter of the reference constants
(recorded in code and the story) until Phase 36 restores transport
throughput. Work-pose RENDERING rides the animation table rows for
116..123 — the chopping body offsets for frames ≥ 0x80 (lumberjack
+0xe80, stonecutter +0x1280) are not yet applied in the appearance
mapping; the pose plays but the dress is the walking set. Felled
trunks persist until Phase 37 decays them.

## Acceptance criteria — re-checked

- [x] Staged fall gated through a real worker.
- [x] Stones shrink by slices.
- [x] Full sweep green on the re-export bridge.
