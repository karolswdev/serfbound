# Evidence — SB-39-01 — The Full Fight

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - the `knightFreeFighting` serf state (20);
  - `#findFreeFightEnemy`: an enemy marching knight on this knight's
    tile or a neighbor, not already fighting;
  - the march step checks for it first — an enemy on contested
    ground stops the march dead;
  - `#startFreeFight`: the lower serf index drives (deterministic),
    the outcome is the existing reference `#setFightOutcome`;
  - `#handleKnightFreeFighting`: the driver runs the reference
    move/animation sequence (the shared knightAttackMoves /
    knightFightAnim tables) and on resolution the loser dies and the
    winner resumes via `#resumeMarchOrEngage` (engage the wall if on
    it, else march on).

## Verification artifacts

```
engine gates (new), both stash-verified failing pre-fix
(no free-fight path — marching knights walk past each other):
  not ok 1 - two enemy knights clash on open ground
  not ok 2 - a mutual assault thins both columns
  (# pass 0 / fail 2 with the engine change stashed)
post-fix:
  ok 1 - a rank-2 and a rank-0 knight one tile apart stop, fight,
         and exactly one survives — the veteran, deterministically
         by seed — and he resumes his march.
  ok 2 - two head-on columns of three thin each other on open
         ground; fewer than six reach the walls.
  engine-serfs: # tests 35 / pass 35
  engine-conquest: # tests 4 / pass 4 (building assault unchanged)
  engine-combat-resolution: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Two enemy knights clash on adjacent ground; one survives by
  seed and marches on (engine-gated, stash-verified).
- [x] A mutual assault thins both columns before the walls
  (engine-gated).
- [x] Full unit sweep + release gates green.

## Scope note

The building-assault fight (SetFightOutcome + the move/animation
sequence) was already a faithful port; this story adds the free
fight the audit named as missing. The Engage/Prepare sub-states are
condensed to a single driven free-fight state — the fight math,
moves, deaths are faithful, the pre-fight choreography is not (the
same condensation the building assault already carries). With both
the AI's launchAttack and the player's commandAttack feeding
marching knights, both now free-fight on contested ground — the
convergence the phase wanted.
