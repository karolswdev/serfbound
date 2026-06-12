# Evidence — SB-38-01 — Fisher, Farmer, Forester in the Open

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `#workOutdoorTrip`: the generic outdoor cycle on the existing
    walk-out machinery — rest half the cycle inside, out through the
    door slide, free-walk on the shared counters to the picked spot,
    strike the pose for one or more attempts, carry the result home
    visibly (`carriedResource` on the walk back), enter;
  - `#fisherTrip`: shore spots by the reference facing rule
    (water-down/grass-up-left → 132, water-left/grass-up → 131),
    ten rod-bobs per trip, each drawing
    `(rand & 0x3f) + 4 < stock` against the adjacent water —
    a catch takes one fish home;
  - `#farmerTrip`: scythe (136) at the nearest standing Field0..5 —
    a stage per cut per SB-37-02 — or the seed bag (135) on open
    ground;
  - `#foresterTrip`: planting pose (122), `NewPine + (rand & 1)` at
    his own feet;
  - the three act-at-a-distance work cases and the remote
    `#plantTree` are DELETED — the world only changes where the
    worker stands.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (all three
professions acted from inside their buildings):
  not ok 1 - fisher, farmer, and forester work in the open, at
             their own feet (SB-38-01)
post-fix:
  ok - the first sapling lands exactly at the forester's feet, the
       first seeds at the farmer's, and the first fish leaves the
       bay with the fisher standing outside at the shore.
  engine-serfs: # tests 24 / pass 24
  engine-economy-chains: # tests 6 / pass 6 (the bread chain holds
    with a farmer who walks his fields)

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Sapling/seeds/fish only change the world at the worker's
  position (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
