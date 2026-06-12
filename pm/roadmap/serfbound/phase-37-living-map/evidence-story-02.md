# Evidence — SB-37-02 — Fields on the Map Clock

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `#updateMapTile` gains the field cases (Map.UpdatePublic
    2835–2869): Seeds0..4 and Field0..4 advance a stage per visit,
    Seeds5 → Field0, Field5 → FieldExpired, FieldExpired → None;
  - the farmer's private growth bookkeeping (workPhase +
    workTargetPosition tracking, harvest-at-any-stage) is deleted:
    each work cycle harvests the nearest standing Field0..5 —
    advancing its stage per the reference, one wheat per cut,
    Field5 expiring under the scythe — or sows Seeds0 on open
    ground when nothing is ready.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 1 - fields grow on the map clock, not in the farmer's
             head (SB-37-02)
  (the condensed farmer harvests his tracked tile at any stage and
   makes wheat inside the first thousand ticks — the gate's
   no-wheat-before-60k clock catches him)
post-fix:
  ok - the farmer sows; the first wheat lands only after the map
       had time to grow a field; a lone sown tile far outside his
       reach walks the whole reference life — seeds, field,
       expired, gone — untouched.
  engine-serfs: # tests 22 / pass 22
  engine-economy-chains: # tests 6 / pass 6 (the bread chain holds
    at map-clock growth within its existing horizon)

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] No wheat before the map grew a field; wheat flows once
  fields stand (engine-gated, stash-verified).
- [x] A sown tile walks seeds → field → expired → gone
  (engine-gated).
- [x] Full unit sweep + release gates green.
