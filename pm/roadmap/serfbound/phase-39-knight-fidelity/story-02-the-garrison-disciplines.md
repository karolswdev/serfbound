# SB-39-02 — The Garrison Disciplines

- **Project:** serfbound
- **Phase:** 39
- **Status:** done
- **Depends on:** SB-38-03
- **Unblocks:** SB-39-03
- **Owner:** unassigned

## Problem

Serfbound's population is a fixed pool: the castle opens with its
crew and never grows, knights appear only when the military sweep
promotes toward castleKnightsWanted, and a garrison once filled is
frozen — no rotation, no rebalancing, no way to pull veterans home.
The reference castle BREATHES: the reproduction counter spawns new
serfs on its clock, the serf-to-knight rate decides which of them
are born to the sword, and knight cycling drains every garrison to
a reduced level and refills it — the two-phase swap.

## Reference ground truth (Player.cs, Building.cs)

- Reproduction (1332–1370): `reproductionCounter -= delta`; each
  expiry adds `serfToKnightRate` (default 20000) into a wrapping
  16-bit accumulator (seeded 0x8000 — "overflow is important"); a
  wrap marks the spawn a knight (burst-capped at 2), needing a
  sword and shield to promote; the counter resets by
  `(60 - reproduction) * 50`.
- CycleKnights (812+): phase one (counter 2400) sets
  ReducedKnightLevel — UpdateMilitary adds 5 to the occupation row
  (the occupant tables' rows 5..9, already ported as data), so
  garrisons kick their excess, weakest first; under 2048 the level
  is restored (phase two) and the buildings refill from stock; at 0
  the cycle clears.
- UpdateMilitary (2077–2095): excess knights leave the building —
  the least trained goes.
- Corrected from this phase's scaffold: CastleKnightsWanted has NO
  conquest feedback in the reference — only the popup's +/- buttons
  drive it (verified: no IncreaseCastleKnightsWanted call sites
  outside UI/PopupBox.cs). The scaffold's claim is struck.

## What ships

- The reproduction clock on every castled player: the pool grows on
  the reference cadence (`reproduction` joins the world settings at
  the custom-game default), and the wrapping serf-to-knight
  accumulator decides who is born a knight —
  `serfToKnightRate` joins the priority book (SB-36-07's home for
  player economy data).
- `cycleKnights(playerIndex)` and the two-phase swap: reduced
  occupation rows engage, garrisons kick their weakest home (they
  walk back and reabsorb through the SB-38-04 escape path), the
  level restores, and the military sweep refills.
- The military sweep learns to KICK as well as fill — excess
  garrison knights (from cycling or occupation changes) leave,
  weakest first, per the reference.

## Acceptance criteria

- [x] A castled player's pool grows on the reproduction clock, and
  a maxed serf-to-knight rate mints knights from sword-and-shield
  stock on the same clock (engine-gated, stash-verified).
- [x] cycleKnights drains a full hut to its reduced level (the
  weakest leaving, walking home to the pool) and refills it when
  the second phase restores the occupation (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Stock knights stay a rank-less count: the cycle refreshes bodies,
  not ranks — a veteran reabsorbing into the pool loses his rank
  until typed knight stock arrives (recorded; SB-39-03 territory).
- sendStrongest moves to SB-39-03, where garrison-sourced attack
  selection gives the toggle something to choose between.
- The reproduction value is a world setting with the custom-game
  default; mission presets wire it when the campaign table is next
  touched (closes half the audit addendum's reproduction note).
