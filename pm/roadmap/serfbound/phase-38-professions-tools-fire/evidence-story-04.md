# Evidence — SB-38-04 — Fire

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `burning`/`burningCounter`
  on WorldBuilding; `igniteBuildingAt` (BurnUp's world half):
  counter 2047 (castle 8191), a burning military post stops
  projecting territory, a burning castle is defeat and its stores
  are lost.
- `packages/engine/src/world-commands.ts` /
  `packages/engine/src/commands.ts` — the `demolish-building` world
  action and the `game.demolish-building` router command: ignition
  is deterministic world state, replayed by saves and lockstep like
  any command.
- `packages/engine/src/serfs.ts` —
  - the `escaping` serf state (EscapeBuilding, condensed to a
    free-walk home — recorded);
  - `#sweepBurning`: first sight of a fire evacuates everyone bound
    to the building (the worker inside or mid-trip, the garrison,
    knights and builders en route), runs the countdown on the game
    clock, and tears the ruin down structurally when it expires;
  - knights reabsorb into the recruited pool at the castle door;
  - burning buildings drop out of the economy: stock priority zero,
    no worker staffing, no knight reinforcement, no gold deliveries.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (the
demolish-building action does not exist):
  not ok 1 - a demolished building burns, its worker escapes home,
             the ruin falls (SB-38-04)
post-fix:
  ok - the staffed lumberjack burns but still stands; its worker
       bolts (escaping) and rejoins the castle pool (idleInStock at
       the castle); the ruin leaves the map only after the
       reference counter (fell after 2032 ticks measured — 2047
       minus one 16-tick sampling step).
  engine-serfs: # tests 26 / pass 26
  engine-economy-chains: # tests 6 / pass 6

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Burn, escape home, countdown teardown (engine-gated,
  stash-verified).
- [x] Full unit sweep + release gates green.
