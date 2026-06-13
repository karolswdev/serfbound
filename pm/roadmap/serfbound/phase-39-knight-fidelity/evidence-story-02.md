# Evidence — SB-39-02 — The Garrison Disciplines

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `reproduction` world setting
  (custom-game default 20); per-player `reproductionCounter` (reset
  `(60 - reproduction) * 50`), the 0x8000-seeded wrapping
  `serfToKnightCounter`, the cycling flags and counter;
  `serfToKnightRate` (default 20000) joins the priority book;
  `militaryKnightsNeeded` reads the occupant tables' reduced rows
  (+5) during cycling's first phase.
- `packages/engine/src/serfs.ts` — the military sweep gains the
  Player.cs clocks: reproduction spawns a serf per counter expiry
  into the castle pool, the accumulator's wraps mark knight births
  (burst cap 2, sword and shield consumed by the promotion);
  `cycleKnights(playerIndex)` starts the two-phase swap (2400-tick
  counter, level restored under 2048); the garrison loop now KICKS
  excess — the weakest resident leaves through the SB-38-04 escape
  path and reabsorbs into the knight pool.
- `tests/ci/engine-military-supply.test.mjs` — the sword-counting
  weaponsmith test holds the new knight pressure still
  (serfToKnightRate 0): reproduction-born knights were eating the
  output as it landed, exactly as the reference's would.

## Corrections recorded

- The phase scaffold claimed CastleKnightsWanted gets conquest
  feedback (+1/−1); the reference has none — only the popup's
  buttons drive it (no Increase/DecreaseCastleKnightsWanted call
  sites outside UI/PopupBox.cs). Struck from the ground truth.
- sendStrongest moves to SB-39-03, where garrison-sourced attack
  selection gives the toggle something to choose between.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix:
  not ok 1 - the garrison breathes: reproduction mints serfs and
             knights, cycling swaps the watch (SB-39-02)
post-fix:
  ok - the pool grows on the 2000-tick reproduction clock; a maxed
       serf-to-knight rate turns every birth into a knight while
       four sword-and-shield pairs last (knights 4, swords 0); a
       threat-3 hut garrisons 3, cycleKnights' reduced row wants 2
       so the weakest walks home, and phase two refills the watch
       before the cycle clears.
  engine-serfs: # tests 29 / pass 29
  engine-economy-chains: # tests 6 / pass 6
  engine-military-supply: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Reproduction clock + knight births (engine-gated,
  stash-verified).
- [x] The two-phase cycling swap: kick, restore, refill
  (engine-gated).
- [x] Full unit sweep + release gates green.
