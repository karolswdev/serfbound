# SB-34-04 — Selection Bleed + On-Device Animation

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-01
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Punch items 3 and 4: play-taps kept text-selecting the chrome, and
the maintainer's phone showed "zero animations — flags don't wave."
Animation death could not be reproduced under default emulation —
but the code held a frozen world waiting to happen.

## What it turned out to be

`syncWaveAnimation` honored `prefers-reduced-motion: reduce` by
never starting the 175ms timer — and that timer drives the entire
game: simulation ticks, serf movement, AI players, autosave,
notifications. iOS "Reduce Motion" (a common accessibility setting)
froze the world outright. Reduced motion now pins the decorative
wave frame only; the simulation always runs. The preference is
published (`data-serfbound-motion`), reacts to live changes, and
the dev ledger gained a visible Pulse row (sim tick · wave frame ·
motion mode) so the maintainer's `?dev=1` device run can split
"flags don't wave" into render vs preference vs throttling at a
glance.

## Acceptance criteria

- [x] Under emulated `prefers-reduced-motion: reduce` at DPR 3 the
  game tick still advances (spec verified to fail on the old gate).
- [x] The chrome never text-selects mid-play (computed
  `user-select: none` asserted from the running game).
- [x] A visible diagnostic exists for the device run (the Pulse row
  in the dev ledger, `?dev=1`).
- [ ] Flags wave on the maintainer's device — owned by the SB-34-05
  device gate; if they still don't, the Pulse row says why.
