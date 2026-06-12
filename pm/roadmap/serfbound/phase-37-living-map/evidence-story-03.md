# Evidence — SB-37-03 — Fish

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` — `#updateMapTile` now opens with
  the Map.UpdateHidden port: on a stocked water tile, a fish spawns
  at `(rand & 0x3f00) != 0` while the stock sits under ten, then one
  fish migrates toward Right/DownRight/Left/UpLeft by
  `(rand >> 2) & 3` when the neighbor passes the world's existing
  four-triangle `isInWater` — the shared RNG, the reference
  arithmetic, in the reference order (hidden before public).

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 1 - fish spawn and migrate: a fished-out bay recovers
             (SB-37-03)
  (static water: the stocked tile holds 3 forever, the emptied
   neighbor stays 0)
post-fix:
  ok - a bay seeded with 3 fish grows its total by spawning, and
       the fished-out neighbor tile restocks by migration.
  engine-serfs: # tests 23 / pass 23
  engine-economy-chains: # tests 6 / pass 6 (the fisher's chain
    holds with water that restocks under him)

npm test -> exit=0 (unit + build + 32 browser specs; lockstep
  checksum gates hold with the fish on the shared RNG)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Spawn toward ten, migration restocks the emptied tile
  (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
