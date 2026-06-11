# SB-36-03 — The Split Road Staffs Itself

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-01
- **Unblocks:** SB-36-06
- **Owner:** unassigned

## Problem

The audit's row 6, and the maintainer's bug verbatim: "when I
created a flag in the middle of the road no new worker came up to
cover the new segment, old one decided to sit right on the flag."
The structural split has existed since Phase 13 with serf
reassignment explicitly deferred — the old transporter's metadata
went stale and the second half was never staffed.

## What shipped

- **Split staffing** (the reference BuildFlagSplitPath serf
  handling, condensed by anchor): the world records each mid-road
  flag; the serf engine recomputes the true transporter counts on
  both ends of both halves from the serfs actually serving them,
  keeps the old transporter on the half his anchor still names, and
  dispatches a fresh transporter from the castle for an unstaffed
  half — but only when the original road was staffed at all, and
  only while the serf pool has slack (a tight pool records the
  reference serfRequested bit, serviced fully with SB-36-04).
- **Felled-wood decay** (a minimal SB-37-01 down-payment, recorded):
  felled trunks rot to stubs and stubs clear on a deterministic
  position-hash — without it the SB-35-03 trunks choked every
  corridor and bricked the AI's road building. Deliberately
  RNG-free: a decay draw per update shifted every downstream seeded
  decision, which the AI suite caught.
- **The AI links to the nearest flag** (the reference linker): it
  always roaded new buildings to the castle flag, whose direct
  corridors exhaust as a settlement grows — buildings stranded
  forever. It now connects to the nearest network flag and retries
  stranded buildings as the map changes.

## Acceptance criteria

- [x] The maintainer's scenario, gated: a staffed straight road
  split by a mid-road flag ends with BOTH halves reporting
  transporters on both ends and two distinct serfs serving them
  (fails pre-fix at "(0,0)" — stash-verified).
- [x] The AI grows its deeper economy with splits, carriers, and
  decay all active (suite green).
- [x] Full unit sweep + release gates green.
