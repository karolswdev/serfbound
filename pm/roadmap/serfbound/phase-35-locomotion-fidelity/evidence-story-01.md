# Evidence — SB-35-01 — One Walking System

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - the fixed-tick ghost stepper (`#stepToward`, `harvestStepTicks`)
    is **deleted**;
  - `#freeWalkToward(serf, target, delta)`: greedy free-walk routing
    where every step goes through the shared `#changeDirection`
    walker — reference walking rows (flat 255 ticks/tile, slope rows
    319..1023), counter accumulation, collision waiting, crossing
    swaps, real collision-map occupancy;
  - `#workHarvest` walking phases ride it (delta threaded from
    `#handleWorking`); the worker clears his collision entry when he
    goes back inside, like settling serfs.

## Verification artifacts

```
engine gate (new): "free walking rides the reference counter tables"
  - watches a real lumberjack's outdoor walk through a real
    settlement; the TYPICAL tile must cost >= 247 ticks and the walk
    must wear walking-row animations (< 81)
  - on the old stepper (stash-verified): FAILS with
    "median 8, steps 8,8,8,8"
  - on the new walker: PASSES

economy at authentic pacing (a 30x slowdown of outdoor walks):
  engine-serfs + engine-economy-chains + engine-ai-behaviors +
  engine-world-commands + engine-lockstep-checksum -> 25 pass, 0 fail
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

Greedy routing (not the reference FreeWalking bookkeeping) — same
condensation knight marching uses, recorded in the audit. Work
dwell durations and the logging five-stage fall are SB-35-03;
building doors/slides are SB-35-02. Crossing swaps make individual
steps instant (reference SwitchWaiting behavior), which is why the
gate asserts the median, not every step.

## Acceptance criteria — re-checked

- [x] One walker; stepper deleted; pacing gated and discriminating.
- [x] Walking-row animations on the outdoor walk.
- [x] Economy/AI/checksum suites green at authentic pacing.
