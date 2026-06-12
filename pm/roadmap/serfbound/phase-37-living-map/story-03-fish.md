# SB-37-03 — Fish

- **Project:** serfbound
- **Phase:** 37
- **Status:** done
- **Depends on:** SB-37-01
- **Unblocks:** SB-38 (fisher's outdoor cycle), SB-40 (waterways)
- **Owner:** unassigned

## Problem

The audit's row 8, last clause: fish only deplete. The generator
seeds water with stock, the fisher draws it down, and nothing comes
back — a settlement's bay is a finite tank. The reference's water
lives: every map-clock visit to a stocked water tile spawns a fish
at 63-in-64 odds while under ten, and sends one swimming to an
adjacent water tile in one of four directions — so stocks wander,
and a fished-out bay restocks from its neighbors.

## Reference ground truth

- Map.cs UpdateHidden (2876–2908): on a water tile with stock —
  spawn (`amount < 10 && (rand & 0x3f00) != 0`), then migrate one
  fish toward Right/DownRight/Left/UpLeft by `(rand >> 2) & 3` when
  the neighbor is in water.
- Map.cs IsInWater (2019–2025): the four-triangle water test.

## What ships

- The UpdateHidden port runs first at every map-clock visit:
  spawn-then-migrate on the shared RNG, exactly the reference
  arithmetic, over the world's existing faithful `isInWater`
  (the four-triangle Map.IsInWater port was already there).

## Acceptance criteria

- [x] A stocked water tile grows toward ten; an emptied neighbor
  tile recovers by migration — the fished-out bay restocks
  (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The fisher still fishes at a distance (Phase 38's outdoor cycle);
  what changed is that the water restocks underneath him.
