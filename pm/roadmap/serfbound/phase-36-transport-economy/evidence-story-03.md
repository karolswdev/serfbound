# Evidence — SB-36-03 — The Split Road Staffs Itself

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `pendingPathSplits`: the
  world records each road split for the serf engine (transient,
  drained the same tick; excluded from checksums).
- `packages/engine/src/serfs.ts` —
  - `#handlePathSplits`: per half, recompute the true transporter
    count on both ends from the serfs actually anchored to it; an
    unstaffed half of a previously-staffed road gets a transporter
    from the castle (pool-slack guarded; tight pools set
    serfRequested);
  - `#updateAmbientDecay`: felled wood → stub → clear, on a
    deterministic position-hash sweep (32 tiles/update). RNG-free on
    purpose — consuming the shared random shifted every seeded
    decision downstream.
- `packages/engine/src/ai.ts` — `#connectToNetwork` links new and
  stranded buildings to the NEAREST own flag (hex distance, first 6
  candidates) instead of only the castle flag; `#reconnectStranded`
  retries roadless buildings each pass.

## Verification artifacts

```
engine gate (new): "a flag splitting a road keeps one half staffed
  and staffs the other" — the maintainer's exact scenario (straight
  4-segment road, staffed, flag at the midpoint):
  - both halves must report freeTransporters >= 1 on both ends and
    two distinct road serfs must exist
  - pre-fix (stash-verified): FAILS at "both halves staffed from the
    split flag's view (0,0)"
diagnosis trail (the AI suite, four rounds):
  1. unconditional split-spawns drained the AI's serf pool ->
     staffed-roads-only + pool reserve
  2. felled trunks from SB-35-03 choked every road corridor ->
     the decay bridge
  3. decay's RNG draws shifted the AI's seeded plan -> position-hash
  4. the castle-flag-only linker stranded buildings as corridors
     exhausted -> nearest-flag linking + reconnect retries
npm run test:unit -> exit=0
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

Reassignment is by anchor flag, not by the serf's standing position
(the reference PathSplited walks the serf list); park/wake and
MaxTransporters land with SB-36-04, which also services the
serfRequested bits this story records. Decay is the bridge slice of
Phase 37, not its growth half.

## Acceptance criteria — re-checked

- [x] The split-road gate, discriminating.
- [x] AI suite green under the new logistics.
- [x] Full sweep + release gates green.
