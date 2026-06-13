# SB-39-01 — The Full Fight

- **Project:** serfbound
- **Phase:** 39
- **Status:** done
- **Depends on:** SB-39-03
- **Unblocks:** SB-39-05
- **Owner:** unassigned

## Problem

The building-assault fight is already a faithful port — SetFightOutcome
with the exact reference math and RandomInt order, the knightAttackMoves
sequence driving both serfs through the fight animations. What the audit
row 13 names as missing is the OTHER half: the free fight. When two
enemy knights meet on open ground, the reference stops them and they
fight to the death (KnightEngage/Prepare/AttackingFree/DefendingFree);
serfbound's marching knights walk straight past each other to their
targets. A mutual assault — both players' columns crossing — resolves
with neither column losing a man until they reach the walls.

## Reference ground truth (Serf.cs)

- KnightFreeWalking → the free-fight engage chain
  (KnightEngageAttackingFree/KnightEngageDefendingFree →
  KnightPrepareAttackingFree → KnightAttackingFree/KnightDefendingFree
  → KnightAttackingVictoryFree/KnightAttackingDefeatFree): two
  knights of opposing players on adjacent ground stop and fight.
- The fight itself reuses SetFightOutcome and the same move/animation
  tables as the building assault — the outcome math is identical, only
  the staging differs.

## What ships

- A free-fight path in the march: a marching knight that finds an
  enemy marching knight on its own or an adjacent tile stops and
  engages a free fight, deterministically (the lower serf index
  drives), resolved by the existing SetFightOutcome. The loser dies;
  the winner resumes his march toward his own target.
- The fight runs the reference move/animation sequence (the shared
  knightAttackMoves / knightFightAnim tables), so a free fight looks
  like a fight, not a teleport.

## Acceptance criteria

- [x] Two enemy knights marching onto adjacent ground stop and
  fight; exactly one survives, deterministically by seed, and the
  survivor resumes marching toward his target (engine-gated,
  stash-verified).
- [x] A mutual assault thins both columns on open ground before
  either reaches the walls — fewer attackers arrive than set out
  (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The reference's Engage/Prepare/Defending sub-states are condensed
  to a single driven free-fight state; the FIGHT (math, moves,
  animations, deaths) is faithful, the pre-fight choreography is not
  (recorded — same condensation the building assault already carries
  for its prepare states).
- The building-assault chain is unchanged (already faithful); the
  AI's pool-spawn launchAttack and the player's commandAttack both
  feed marching knights, so both now free-fight on contested ground —
  the convergence the phase wanted.
- Defenders still sortie only at the wall, not onto open ground to
  intercept (the reference's SendOffToFight from a besieged building
  is a larger behavior — recorded for later).
