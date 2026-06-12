# Evidence — SB-37-01 — Trees Grow and Stumps Rot

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/map-generator.ts` — mapObject gains the
  reference values 93–126 (felled bases, saplings, seeds, field
  stages, signs); the space table covers fields as semipassable and
  signs as open per the reference Space table.
- `packages/engine/src/serfs.ts` —
  - `#updateMapAmbience` (Map.cs Update): the cadence arithmetic
    (`counter -= delta`, `regions = (cols>>5)*(rows>>5)` visits per
    20 deficit), the 23-column walk with the row drop on wrap, the
    RemoveSignsCounter (reset 16) — on the SHARED game random, as
    Game.cs passes state.Random;
  - `#updateMapTile` (UpdatePublic): Stub → None at 25%,
    FelledPine/FelledTree → Stub, NewPine/NewTree mature at
    `(rand & 0x300) == 0` into Pine0..7/Tree0..7 by `rand & 7`,
    signs clear at counter 0 (inert until Phase 38 plants signs);
  - the RNG-free position-hash decay bridge is DELETED;
  - the forester plants `NewPine + (rand & 1)` (Serf.cs 7383) — the
    instant-maturity shortcut is deleted.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 1 - the map clock: saplings mature, trunks rot to stubs,
             stubs clear (SB-37-01)
post-fix:
  ok - a seeded felled trunk rots to a stub, the stub clears, a
       planted NewTree matures into Tree0..7, and the staffed
       forester's plantings appear as saplings — never instant
       trees.
  engine-serfs: # tests 21 / pass 21
  engine-economy-chains: # tests 6 / pass 6 (the corridors still
    clear under the reference decay — the bridge's job, now done
    by the real clock)

npm test -> exit=0 (unit + build + 32 browser specs; the lockstep
  checksum gates hold with ambience on the shared RNG — the phase's
  determinism criterion)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Sapling → mature tree on the map clock; instant maturity
  deleted (engine-gated, stash-verified).
- [x] Felled → stub → cleared (engine-gated).
- [x] Lockstep determinism green with shared-RNG ambience.
- [x] Full unit sweep + release gates green.
