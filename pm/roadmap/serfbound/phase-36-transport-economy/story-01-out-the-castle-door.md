# SB-36-01 — Out the Castle Door

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** none (first story of the phase)
- **Unblocks:** SB-36-02..06
- **Owner:** unassigned

## Problem

The audit's row 4, and the maintainer's "nobody brings out the raw
materials, they literally just appear at the castle door":
`pendingOut` teleported resources straight into the castle flag's
slots. The reference walks them out — MoveResourceOut →
WaitForResourceOut → DropResourceOut — in a serf's arms.

## What shipped

Every outbound resource is carried. A serf from the stock (an idle
one, or one drawn from the pool) takes the resource, slides out the
castle door (the SB-35-02 leave slide, carrying torso showing the
cargo), stands at the flag in the new `dropResourceOut` state, sets
it down, and walks back inside through the door to rejoin the pool.
One carrier is out at a time — the reference queues inside, so
dispatch gates on the flag tile and on carriers mid-slide. If the
slots filled while he slid out, he takes the resource back inside
and requeues it; nobody ever stands on the flag blocking the
transporters that drain it.

## Found by the gates en route

The first cut launched a carrier per update during each other's
door slides: four carriers crowded the flag tile, walled off the
transporters, the slots never drained, and the whole economy froze
(the mine suite caught it at tick 200k with the castle flag
permanently full). Hence the in-flight gate and the
take-it-back-inside rule.

## Acceptance criteria

- [x] A serf stands at the flag with the resource in his arms, and
  the FIRST resource to appear in the flag's slots was carried there
  (engine-gated; the teleport drain fails it — stash-verified).
- [x] Carriers render with the carrying torsos (the carry offsets
  apply to dropResourceOut and the leave slide).
- [x] Full unit sweep green: construction logistics, chains, mines,
  AI, lockstep checksums all run on carried exports.
