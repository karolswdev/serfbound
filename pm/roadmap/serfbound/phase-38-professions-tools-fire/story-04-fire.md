# SB-38-04 — Fire

- **Project:** serfbound
- **Phase:** 38
- **Status:** done
- **Depends on:** SB-38-01
- **Unblocks:** SB-38-05, SB-38-06
- **Owner:** unassigned

## Problem

The audit's row 12: demolition is structural removal — a building
the player tears down blinks out of the world, nobody inside
reacts, and there is nothing to watch. In the reference a
demolished building BURNS: the holder bolts out the door, knights
flee their post, the fire runs a 2047-tick counter (8191 for a
castle, whose fall also defeats its player), and only then does the
ruin leave the map.

## Reference ground truth

- Building.cs BurnUp (485–603): Burning set, counter 2047/8191, the
  holder ejected (BuildingDeleted → EscapeBuilding), garrison
  knights ejected, military land ownership recalculated, castle →
  inventory deleted + PlayerDefeated.
- Serf.cs HandleSerfEscapeBuildingState (7728): the escapee appears
  at the building and becomes Lost — he makes his own way home.
- Game.cs UpdateBuildings: the burning counter runs on the game
  clock; the ruin is removed when it expires.

## What ships

- `burning`/`burningCounter` on WorldBuilding and the
  `demolish-building` world action (`game.demolish-building` on the
  router): ignition is deterministic world state, so lockstep
  replays it like any command.
- The engine's burning sweep: on first sight of a fire it ejects
  everyone — the worker inside, the garrison — into the new
  `escaping` state (out the door, free-walk home to the castle
  pool); it runs the countdown and tears the ruin down structurally
  when it expires.
- Burning buildings drop out of the economy: no stock priority, no
  worker staffing, no knight reinforcement, no gold deliveries.

## Acceptance criteria

- [x] Demolishing a staffed lumberjack sets it burning (still
  standing), sends its worker out the door home to the castle, and
  removes the ruin only after the reference countdown (engine-gated,
  stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The escapee skips the reference's Lost wandering — he free-walks
  straight home (recorded with the SB-38-01 walker note); with no
  castle left he stands where he is.
- Conquest's captured-castle and civilian-ring demolitions stay
  instant (the capture path predates fire) — recorded for the
  conquest fidelity work (Phase 39).
- The demolish button on the building popup is app surface — it
  rides the alpha gate; the command API is the story.
