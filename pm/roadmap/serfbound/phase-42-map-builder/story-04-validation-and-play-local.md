# SB-42-04 — Validation and Play-Local

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** SB-42-03
- **Unblocks:** SB-42-05
- **Owner:** unassigned

## Problem

An author needs to know their map is *playable* before they trust it,
and the only real proof is playing it. This story closes the local
loop: a live playability verdict and "play this map" feeding an
authored map straight through the engine into a running game.

## What ships

- `evaluateMapPlayability(landscape, starts, playerCount)` + the
  `MapEditor.validate()` method: each player's start is checked by the
  game's own `canBuildCastle` (against a scratch world), the buildable-
  land ratio is measured, and per-player buildable-nearby is reported.
  Verdict is `playable` + typed errors (`missing-start`,
  `start-not-placeable`, `insufficient-buildable`).
- The `customMap` option threaded through `startSerfboundLocalGame`:
  a custom map fixes the world size, seeds the player count, and its
  decoded landscape supersedes the seed — "play this map" works.

## Acceptance criteria

- [x] A two-good-start grass map validates playable; a missing start
  and an all-water map each produce the named error (engine-gated,
  stash-verified).
- [x] An authored custom map plays: `startSerfboundLocalGame` with the
  map starts a game on the authored landscape, and a castle founds at
  the authored start (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Reachability and symmetry/balance are advisory (buildable-nearby is
  reported; the gallery rating is the real balance signal, per the
  decision doc) — the hard gate is castle-placeable starts + a minimum
  buildable ratio.
- The validity STRIP and the "play" button are editor UI proven at the
  device gate (SB-42-05); the verdict and the play seam are CI-held.
