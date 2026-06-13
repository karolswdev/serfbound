# SB-40-01 — The Boatbuilder Builds Boats

- **Project:** serfbound
- **Phase:** 40
- **Status:** done
- **Depends on:** SB-38-03
- **Unblocks:** SB-40-02
- **Owner:** unassigned

## Problem

The boatbuilder is the game's one buildable no-op: it stands in the
build menu with a sprite and a stock slot, but it has no case in the
profession work switch, so a player can spend planks and a worker on
a building that produces nothing. The boat resource exists in the
inventory enum and is made by no one.

## Reference ground truth (Serf.cs HandleSerfBuildingBoat)

- The boatbuilder consumes one plank from stock (UseResourceInStock)
  and works a 9-step mode cycle (animation 146), then pushes a boat
  out the door (MoveResourceOut → DropResourceOut) and starts over.

## What ships

- The boatbuilder joins `workedBuildingTypes` so it requests its
  worker (already hammer-gated by SB-38-03, already fed planks by the
  SB-36-07 stock book).
- A boatbuilder case in `#handleWorking`: one plank in, one boat out,
  on the same conversion cycle the sawmill uses — the no-op is dead.

## Acceptance criteria

- [x] A staffed boatbuilder with planks in stock produces boats, one
  per plank, delivered into the inventory; with no planks it makes
  nothing (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- Boats accumulate in the inventory for now — nothing consumes them
  until SB-40-02 puts sailors on water roads. The production is the
  story; the consumer is the next.
- The 9-step BuildingBoat mode animation is condensed to the shared
  conversion dwell (the same condensation every production building
  carries); the worker pose rides the existing work rendering.
