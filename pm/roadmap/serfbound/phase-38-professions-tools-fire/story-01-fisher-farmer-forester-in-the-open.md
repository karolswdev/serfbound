# SB-38-01 — Fisher, Farmer, Forester in the Open

- **Project:** serfbound
- **Phase:** 38
- **Status:** done
- **Depends on:** SB-37-02, SB-37-03
- **Unblocks:** SB-38-02, SB-38-05
- **Owner:** unassigned

## Problem

The audit's row 9: the lumberjack and stonecutter walk out (SB-34
round 7, paced right by SB-35), but the fisher, farmer, and
forester still act at a distance — fish leave the water, fields
advance, and saplings land while the worker sits invisible inside
his building. The reference sends every outdoor profession on a
trip: out the door, free-walk to the spot, work it under the
player's eyes with its own pose, and walk home with the catch.

## Reference ground truth (Serf.cs)

- The fisher stands on a shore tile (paths clear; water below with
  grass up-left → animation 132, or water to the left with grass
  above → 131) and bobs the rod up to ten times, each bob drawing
  `(rand & 0x3f) + 4 < stock` against the adjacent water — the
  catch takes one fish home (6555–6610, HandleSerfFishingState).
- The farmer arrives at an existing field with the scythe
  (animation 136) or at empty ground with the seed bag (135);
  harvesting advances the stage, sowing lays Seeds0
  (HandleSerfFarmingState).
- The forester arrives (121) and plants (122)
  `NewPine + (rand & 1)` at his own feet on path-free empty ground
  (HandleSerfPlantingState).

## What ships

- `#workOutdoorTrip`: the generic outdoor cycle on the existing
  walk-out machinery (door slide, shared-counter free walk, dwell
  pose, walk home) with per-trip attempts — one for planting and
  farming, ten rod-bobs for fishing — and the product carried
  visibly home.
- The fisher, farmer, and forester move onto it; their
  act-at-a-distance work cases and the remote `#plantTree` are
  deleted. The world only changes where the worker stands.

## Acceptance criteria

- [x] When the first sapling lands, the forester is standing on its
  tile; when the first seeds land, the farmer is standing on them;
  when the water first loses a fish, the fisher is standing at the
  shore — none of it happens from inside a building (engine-gated,
  stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The free walk stays the shared greedy-descent walker (SB-35-01);
  the reference's FreeWalking distance bookkeeping
  (NegDistance1/2 encoding) is not ported.
- The fisher's ten bobs run as ten catch draws on one dwell rhythm
  (448 ticks per bob) rather than the reference's alternating
  768/128 bob counters — same RNG count, same odds, recorded.
- The farmer does not harvest Seeds5 (recorded with SB-37-02).
- The lumberjack and stonecutter keep their existing staged-work
  cycle (`#workHarvest`) untouched.
