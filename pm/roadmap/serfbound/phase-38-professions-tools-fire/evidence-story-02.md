# Evidence — SB-38-02 — The Geologist

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - the `prospecting` serf state (18) and `geoTargetFlagIndex` on
    WorldSerf;
  - `sendGeologist(flagIndex)`: a castle serf walks the roads to the
    flag (the arrival hook in walking flips him to prospecting);
  - `#handleProspecting`: the reference loop — LookingForGeoSpot's
    eight tries at `((rand >> 2) & 0x3f) + 1` spiral distance over
    mountain-touching empty ground (`#touchesMountain`,
    Tundra0..Snow0 in any of the four triangles), two strikes on
    existing signs end the outing; the free walk to the spot; the
    sample hammer (142) and the sign at his feet —
    `SignLargeGold + 2 * (mineral - 1) + (amount < 12 ? 1 : 0)`,
    SignEmpty on barren ground; the walk home into the castle pool
    when the range is sampled out. The SB-37-01 sign decay now has
    something to fade.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix
(engine.sendGeologist does not exist):
  not ok 1 - the geologist prospects the mountains and plants the
             signs (SB-38-02)
post-fix:
  ok - sent to a road-end flag by a tundra range with one rich coal
       seam: the LARGE coal sign (116 = 112 + 2*(3-1), amount 12)
       lands exactly on the deposit with the geologist standing on
       it, barren slopes collect empty signs, and he walks home to
       the castle when the range is sampled out.
  engine-serfs: # tests 25 / pass 25

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] The correct large coal sign on the deposit, empty signs on
  barren slopes, all at his feet; home to the castle (engine-gated,
  stash-verified).
- [x] Full unit sweep + release gates green.
