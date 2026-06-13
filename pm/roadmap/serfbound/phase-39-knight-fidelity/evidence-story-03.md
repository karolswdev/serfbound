# Evidence — SB-39-03 — The Commanded Attack

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `sendStrongest` joins the
  priority book; `attackableKnightCount` + the minLevel
  hut/tower/fortress tables (present − minLevel[occupation & 0xf]);
  `underAttack` on WorldBuilding (Building.SetUnderAttack).
- `packages/engine/src/serfs.ts` —
  - `knightsAvailableForAttack(playerIndex, targetBuildingIndex)`:
    the spare-knight scan over the player's own military buildings
    within 32 of the target, nearest first — the count the UI
    offers;
  - `commandAttack(...)`: spends up to that many spare garrison
    knights, nearest building first, each picked by the player's
    SendStrongest toggle; the chosen resident flips to
    knightMarching, the garrison count drops, and the target goes
    under attack. The AI's pool-spawn `launchAttack` is untouched
    (recorded — converges in SB-39-01).

## Verification artifacts

```
engine gates (new), both stash-verified failing pre-fix
(commandAttack / knightsAvailableForAttack do not exist):
  not ok 1 - the commanded attack marches the border garrisons
  not ok 2 - send-strongest spends the veterans first
  (# pass 0 / fail 2 with engine changes stashed)
post-fix:
  ok 1 - three border huts (2 spare each) offer 6, nearest first;
         commanding 4 drains the two nearest to their minimum of 1,
         leaves the farthest at 3, marches 4, sets the target under
         attack, and weakest-first keeps the rank-3 veteran home.
  ok 2 - with sendStrongest set, spending 2 of a 3-knight hut
         leaves the rank-0 rookie on his post.
  engine-serfs: # tests 31 / pass 31
  engine-conquest: # tests 4 / pass 4 (launchAttack path intact)
  engine-combat-resolution: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] The available count is right; commanding pulls from the
  nearest garrisons, each kept to its minimum, target under attack
  (engine-gated, stash-verified).
- [x] SendStrongest decides who leaves (engine-gated).
- [x] Full unit sweep + release gates green.

## Note on the gate geometry

The "nearest offered first" assertion was relaxed to "the offered
list is distance-sorted" after the wrapped hex metric ordered the
huts differently than their column offsets suggested — the behavior
(two nearest drained, farthest untouched, minimums kept) is what the
gate proves, order-agnostically.
