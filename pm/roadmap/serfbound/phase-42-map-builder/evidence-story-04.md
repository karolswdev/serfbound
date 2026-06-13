# Evidence — SB-42-04 — Validation and Play-Local

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/map-editor.ts` — `evaluateMapPlayability` (a
  pure verdict over landscape + starts: each start checked by the
  game's `canBuildCastle` on a scratch world, buildable-land ratio,
  per-player buildable-nearby, typed errors) and `MapEditor.validate()`.
- `packages/engine/src/local-game.ts` — the `customMap` option on
  `startSerfboundLocalGame`: a custom map fixes the map size, seeds the
  player count, and its decoded landscape supersedes the seed.

## Verification artifacts

```
engine gates (new), both stash-verified failing pre-fix:
  not ok 8 - validation gives a playable verdict, and names what's
             wrong (SB-42-04)
  not ok 9 - play this map: an authored custom map runs in a local
             game (SB-42-04)
  (# pass 0 / fail 2 with the engine changes stashed)
post-fix:
  ok 8 - two good starts on a grass plateau validate playable (>50%
         buildable, every start placeable with buildable nearby); a
         missing player-2 start raises missing-start; an all-water map
         raises insufficient-buildable.
  ok 9 - an authored map exports, plays through
         startSerfboundLocalGame's customMap seam (catalog metadata
         only, CI-safe), the world is the authored size, and a castle
         founds at the authored start — the map runs.
  engine-map-editor: # tests 9 / pass 9

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Playable verdict + named errors (engine-gated, stash-verified).
- [x] An authored map plays and founds a castle (engine-gated).
- [x] Full unit sweep + release gates green.
