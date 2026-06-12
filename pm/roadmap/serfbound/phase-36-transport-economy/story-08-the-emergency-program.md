# SB-36-08 — The Emergency Program

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-05
- **Unblocks:** SB-36-06
- **Owner:** unassigned

## Problem

The audit addendum's row 21. A reference settlement that runs out
of planks or stones does not just stall: the player flips into the
emergency program — every unfinished building that is not a
lumberjack, sawmill, or stonecutter loses its builder request and
its in-flight materials, and the whole construction economy
funnels into rebuilding the wood-and-stone chain until one of each
essential stands supplied. Serfbound has nothing: a starved
settlement wedges its scarce planks into whatever site happened to
be queued first.

## Reference ground truth

- Player.cs UpdateEmergencyProgram (1402–1486): OFF when one
  lumberjack, one stonecutter, and one sawmill each stand done or
  fully supplied; ON when inventory planks or stones minus the cost
  of the missing essentials reaches zero; activation cancels
  transport to every unfinished non-essential building
  (FlagResetTransport) and zeroes its stock priorities.
- Building.cs UpdateUnfinished (1779–1795): during an active
  emergency, non-essential sites request no builder and zero their
  material requests.

## What ships

- `emergencyProgramActive` on WorldPlayer, driven by a 64-tick
  sweep porting UpdateEmergencyProgram: the missing-essentials
  arithmetic over the construction-cost table, the
  done-or-fully-supplied recovery check.
- Activation cancels the non-essential pipeline: queued castle
  exports to those sites return to stock, flag slots and carriers
  bound for them lose their destinations (the resources re-home
  through SB-36-02), site requests zero, and the sites re-enter the
  dispatch queue.
- `dispatchConstructionLogistics` refuses non-essential sites while
  the emergency is active; deactivation re-dispatches every
  unfinished site it held back.

## Acceptance criteria

- [x] A castle short of planks activates the program, claws back
  the hut's queued materials, and refuses new non-essential
  dispatches while letting a lumberjack site through; standing the
  essential trio deactivates it and the hut's logistics re-dispatch
  (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The reference's once-per-game auto-reactivation gate for human
  players (EmergencyProgramWasDeactivatedOnce, tied to the
  notification flow) is not ported — it rides Phase 41's messenger
  with the EmergencyActive/Neutral notifications themselves.
- planksConstruction stays unconsumed: the reference reads it in
  UpdateUnfinished's per-site material requests, and serfbound's
  construction dispatch is one-shot (recorded; corrects SB-36-07's
  note that pointed it here).
- "Fully supplied" approximates HasAllConstructionMaterialsAtLocation
  as delivered-plus-consumed reaching the cost table.
