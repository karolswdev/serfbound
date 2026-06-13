# Evidence — SB-40-01 — The Boatbuilder Builds Boats

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` — the boatbuilder (type 3) joins
  `workedBuildingTypes` (so it requests its worker, already
  hammer-gated by SB-38-03 and fed planks by the SB-36-07 stock
  book), and gains a `#handleWorking` case converting one plank to
  one boat on the shared conversion cycle — the same shape the
  sawmill uses for lumber → plank. The game's one buildable no-op is
  dead.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (the boatbuilder
has no work case — it builds nothing):
  not ok 1 - the boatbuilder builds boats from planks (SB-40-01)
post-fix:
  ok - a staffed boatbuilder makes nothing with no planks; fed
       three planks it makes three boats, the transporter carries
       them into the inventory, and the planks are consumed.
  engine-serfs: # tests 36 / pass 36
  engine-economy-chains: # tests 6 / pass 6

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] A staffed boatbuilder makes boats one-per-plank, delivered to
  the inventory; no planks, no boats (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
