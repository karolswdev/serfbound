# SB-42-03 — Objects, Minerals, Starts

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-02
- **Unblocks:** SB-42-04
- **Owner:** unassigned

## Problem

A terrain-and-height map is a blank world. To author a real one the
editor needs the rest of the palette: the natural objects (trees,
pines, palms, stones, cactus — and the water trees/stones that belong
in water), the hidden mineral deposits the geologist will find, the
fish stocks in the shallows, and each player's castle start. Each
needs the engine's own legality so the editor never authors a map the
game can't load — a tree in the ocean, a castle on a cliff.

## Codebase ground truth

- `mapSpaceFromObject` + the object/terrain enums (map-generator.ts):
  water is terrain 0..3, land 4..15; water objects (water trees
  28..31, water stones 88..89) belong in water, land vegetation/rock
  in land. Runtime objects (flags, buildings, stubs, felled, seeds,
  signs) are NOT authorable — the game places those.
- `mapMinerals` (1..4 = gold/iron/coal/stone); `resourceAmounts`
  carries the deposit size (and, with mineral none on water, the fish
  stock).
- `canBuildCastle(position, player)` (game-world.ts) is the
  authoritative start validator; a fresh world has no owners, so the
  editor checks a start by building a scratch world from
  `toLandscape()` and asking it.

## What ships

- `MapEditor.placeObject(position, object)` / `eraseObject`: the
  authorable palette only, water objects gated to water tiles and land
  objects to land tiles (illegal placements refused, recorded in the
  undo ring like every byte).
- `seedMineral(position, mineral, amount)` and `seedFish(position,
  amount)`: write the `minerals` + `resourceAmounts` bytes (fish gated
  to water).
- The castle starts: `setStart(player, position, supplies)` /
  `clearStart` / `starts`, each validated live by `isCastlePlaceable`
  (a scratch-world `canBuildCastle`). The starts ride into
  `encodeCustomMap`'s `starts`.

## Acceptance criteria

- [x] A land object places on land and is refused on water; a water
  object the reverse; a non-authorable object value is refused — all
  via the engine's own space rule (engine-gated, stash-verified).
- [x] Minerals and fish write the expected `minerals`/`resourceAmounts`
  bytes; fish refuse a land tile (engine-gated).
- [x] A start on a legal site is accepted and round-trips through
  `encodeCustomMap`; a start on an illegal site (object-blocked) is
  refused by the live `canBuildCastle` (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Mineral deposits are hidden data the geologist reveals, so the editor
  allows them on any tile (the generator favors mountains, but
  authoring freedom is legitimate); only fish are terrain-gated
  (recorded).
- Start placement validates each site as castle-placeable on the bare
  landscape; far-apart/balance checks are advisory in SB-42-04, not a
  hard rule here.
- Starts are authoring metadata, not landscape bytes — they are not in
  the undo ring (recorded).
