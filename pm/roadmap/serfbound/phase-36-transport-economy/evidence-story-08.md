# Evidence — SB-36-08 — The Emergency Program

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `emergencyProgramActive` on
  WorldPlayer.
- `packages/engine/src/serfs.ts` —
  - `#sweepEmergencyProgram` (64-tick cadence): the
    Player.UpdateEmergencyProgram port — recovery when one
    lumberjack, one stonecutter, and one sawmill each stand done or
    fully supplied (`#fullySupplied` approximates
    HasAllConstructionMaterialsAtLocation from the cost table);
    activation when inventory planks or stones minus the missing
    essentials' costs reach zero;
  - `#cancelNonEssentialConstruction` (FlagResetTransport, scoped):
    staged castle exports to held sites return to stock, flag slots
    and carriers bound for them lose their destinations (the
    SB-36-02 sweep re-homes the orphans), site requests zero, and
    the sites leave the dispatched set;
  - `#redispatchHeldConstruction`: deactivation re-dispatches every
    unfinished site the program held back;
  - `dispatchConstructionLogistics` refuses non-essential sites
    while the emergency is active (Building.UpdateUnfinished's
    essential-only rule).

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 1 - the emergency program: short stocks funnel construction
             into the essential trio (SB-36-08)
post-fix:
  ok - five planks against the missing trio's seven trip the
       program; the hut's staged plank and stone are clawed back
       into stock; a second hut on a live road is refused while a
       lumberjack site dispatches; standing the trio lifts the
       program and the hut's logistics re-dispatch.
  engine-serfs: # tests 20 / pass 20
  engine-economy-chains: # tests 6 / pass 6

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Trip, claw-back, essential-only dispatch, recovery and
  re-dispatch (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
