# Evidence — SB-39-04 — Gold and Morale in Full

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `castleScore` on
  WorldPlayer; `captureBuilding` raises the conqueror's on taking an
  enemy castle, `demolishBuildingAt` lowers the owner's on a lost
  castle; `updateKnightMorale` gains the reference castle-score
  adjustment after the gold ratio (`< 0 → max(1, morale − 1023)`,
  `> 0 → min(morale + 1024 * castleScore, 0xffff)`).
- `packages/engine/src/serfs.ts` — the morale sweep runs on the
  reference 256-tick cadence (was 1024).

## Correction recorded

The SB-39-02 scaffold note pinned conquest feedback on
CastleKnightsWanted; the reference has none there — it feeds
conquest into morale through CastleScore. This story is that
feedback, in its real home.

## Verification artifacts

```
engine gates (new), both stash-verified failing pre-fix
(castleScore does not exist; cadence is 1024):
  not ok 1 - conquest swings morale
  not ok 2 - the conquest paths drive castle score, 256-tick cadence
  (# pass 0 / fail 2 with engine changes stashed)
post-fix:
  ok 1 - two players with identical gold get identical morale;
         castleScore +1 lifts the conqueror by exactly 1024,
         castleScore -1 craters the loser to max(1, base - 1023).
  ok 2 - capturing an enemy castle sets the conqueror's score +1
         and the loser's -1; the morale sweep recomputes inside
         256 ticks with the castle-score lift present.
  engine-serfs: # tests 33 / pass 33
  engine-conquest: # tests 4 / pass 4
  engine-combat-resolution: # tests 4 / pass 4
  engine-military-supply: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Conquest swings morale up/down via castleScore beyond the
  gold ratio (engine-gated, stash-verified).
- [x] Morale refreshes on the 256-tick cadence (engine-gated).
- [x] Full unit sweep + release gates green.
