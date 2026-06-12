# SB-37-01 — Trees Grow and Stumps Rot

- **Project:** serfbound
- **Phase:** 37
- **Status:** done
- **Depends on:** SB-36-05
- **Unblocks:** SB-37-02, SB-37-03
- **Owner:** unassigned

## Problem

The audit's row 8: the map is static. The forester's sapling
matures the instant it touches the ground (recorded condensation),
felled trunks rot through an RNG-free position-hash bridge that
exists only because the AI suite bricked without it, and nothing
runs the reference's map clock. The reference walks the map on a
precise cadence every update and lets the world age: saplings
mature by chance, felled trunks become stubs, stubs vanish,
prospecting signs fade.

## Reference ground truth (Map.cs)

- Update (2354–2396): `counter -= tickDelta`; per 20 deficit,
  `regions = (cols>>5)*(rows>>5)` tiles are visited, stepping 23
  columns right (down a row on wrap); RemoveSignsCounter decrements
  per visit, resetting to 16.
- UpdatePublic (2796–2873): Stub → None at `(rand & 3) == 0`;
  FelledPine0..4/FelledTree0..4 → Stub; NewPine/NewTree mature when
  `(rand & 0x300) == 0` into Pine0..7/Tree0..7 by `rand & 7`; signs
  clear when the counter sits at 0. (Seeds/fields ride SB-37-02,
  fish ride SB-37-03.)
- Serf.cs 7383: the forester plants `NewPine + (RandomInt() & 1)`.
- Game.cs 380: the map updates on the SHARED game random — ambience
  is part of the deterministic state.

## What ships

- The reference map clock: `#updateMapAmbience` ports Update's
  cadence arithmetic, the 23-column walk, the signs counter, and
  UpdatePublic's stub/felled/sapling/sign cases, on the engine's
  shared RNG. The position-hash decay bridge is deleted.
- The forester plants `NewPine + (rand & 1)` — a sapling that takes
  map time to become a tree; the instant-maturity shortcut is
  deleted.
- mapObject gains the reference values 103–126 (saplings, seeds,
  fields, signs) and the space table covers them per the reference.

## Acceptance criteria

- [x] A planted sapling is a NewPine/NewTree object, not a tree,
  and matures into Pine0..7/Tree0..7 under engine updates
  (engine-gated, stash-verified).
- [x] A felled trunk becomes a stub and the stub eventually clears
  through the map clock (engine-gated).
- [x] Determinism holds: the lockstep checksum gates stay green
  with ambience on the shared RNG.
- [x] Full unit sweep + release gates green.

## Honest limits

- Seeds/field aging and fish ride SB-37-02/03 — UpdatePublic's
  field cases and UpdateHidden are not yet wired.
- Sign decay is ported but inert until Phase 38's geologist plants
  signs.
- Tiny worlds (under 32 columns) run `max(1, regions)` so test maps
  age at all — the reference never generates one.
