# SB-39-03 — The Commanded Attack

- **Project:** serfbound
- **Phase:** 39
- **Status:** done
- **Depends on:** SB-39-02
- **Unblocks:** SB-39-05
- **Owner:** unassigned

## Problem

Serfbound's only attack is the AI's `launchAttack`: it spawns
knights out of the castle inventory and marches them. The player
cannot order one at all, and the reference attack is a different
thing entirely — knights march from the BORDER BUILDINGS near the
target, each garrison keeping its minimum and spending its surplus,
and the player chooses how many of the available knights go,
strongest or weakest first.

## Reference ground truth (Player.cs)

- KnightsAvailableForAttack(targetPosition): spiral the player's
  own land around the target; each owned, done, non-burning
  hut/tower/fortress contributes `present − minLevel[occupation &
  0xf]` spare knights, binned by distance shell (`i >> 3`). The sum
  is MaxAttackingKnights — the cap the UI offers.
- minLevelHut [1,1,2,2,3], minLevelTower [1,2,3,4,6],
  minLevelFortress [1,3,6,9,12].
- StartAttack: from the gathered buildings, send `toSend` knights
  each — the strongest when SendStrongest, else the weakest
  (CallAttackerOut by type) — toward the target, which goes under
  attack.

## What ships

- `knightsAvailableForAttack(playerIndex, targetBuildingIndex)`:
  the spare-knight scan over the player's military buildings within
  range of the target, returning the max count and the contributing
  buildings nearest-first — the number the player's UI offers.
- `commandAttack(playerIndex, targetBuildingIndex, knightCount,
  gameTick)`: spends up to that many spare garrison knights,
  nearest building first, each picked by the player's SendStrongest
  toggle; every chosen knight leaves his post (the garrison count
  drops, the resident entity flips to `knightMarching`) and the
  target goes under attack. The pool-spawn `launchAttack` stays the
  AI's condensed path (recorded; converges in SB-39-01).
- `sendStrongest` joins the priority book (its home with the other
  player military settings).

## Acceptance criteria

- [x] A player with three border huts (two surplus knights each,
  one a veteran) is offered the right available count; commanding
  four pulls them from the nearest huts first, leaving each its
  minimum, and the chosen knights march on the target which goes
  under attack (engine-gated, stash-verified).
- [x] SendStrongest decides whether the veteran or a rookie leaves
  a garrison (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Garrison knights stay rank-bearing entities idling at the post;
  the reference's FirstKnight linked list and CallAttackerOut are
  condensed to a position-and-rank scan (recorded with SB-39-02's
  pool note).
- The march and fight reuse the existing condensed
  knightMarching → engage chain; the full fight state machine is
  SB-39-01.
- The UI that shows the available count and the slider is app
  surface — it rides the device gate; the engine API is the story.
