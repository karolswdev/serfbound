# Phase 39 — Knight Fidelity

**Last updated:** 2026-06-13 (SB-39-01 done: the free fight — two
enemy knights meeting on open ground stop and clash to the death
with the reference fight math, the survivor marching on, so a
mutual assault thins both columns before the walls; the AI's
launchAttack and the player's commandAttack both feed it. With
every engineering story done — SB-39-01/02/03/04 — the phase stands
at the device gate (SB-39-05)).
**Status:** at the device gate.

## Goal

The war game as the reference plays it, not a sketch of one: knights
fight through the full state machine (engage, prepare, attack,
defend, free fights on open ground, occupying what they win), the
garrison runs on the player's disciplines (castle knights wanted,
serf-to-knight rate, knight cycling, send strongest or weakest), the
player commands an attack by picking a target and choosing how many
knights march, and gold raises morale the way the reference computes
it. Today Serfbound resolves combat with 5 knight states against the
reference's 30+, dispatches greedily from the castle, and trains
nobody.

## Reference ground truth (Freeserf.Core)

- Serf.cs 122–157: the 30+ knight states — Engage/Prepare/Attack/
  Defend pairs, the Free variants for open-ground fights,
  Victory/Defeat/VictoryFree/DefeatFree, KnightOccupyEnemyBuilding,
  DefendingHut/Tower/Fortress/Castle, LeaveForFight and
  LeaveForWalkToFight.
- Serf.cs 4752–4790: fight resolution — attacker morale
  `(0x100 * expFactor * landFactor) >> 16` vs defender
  `(0x400 * expFactor * landFactor) >> 16`, settled against the
  shared RNG.
- Player.cs 1495–1571 + GameState.cs: KnightMorale from
  MapGoldMoraleFactor — depot gold against the map total — updated
  every 256 ticks. (~~Conquest feedback on CastleKnightsWanted~~ —
  struck 2026-06-13: the reference has none; only the popup's
  buttons drive the setting.)
- PlayerSettings.cs: SerfToKnightRate, CastleKnightsWanted,
  SendStrongest, the knight-cycling flags and KnightCycleCounter
  two-phase swap.
- Building.cs 806–863, 2213–2290: CallAttackerOut and
  SendKnightToBuilding honoring occupation min/max nibbles and the
  SendStrongest preference; SetUnderAttack.
- The reference attack flow: select an attackable enemy building,
  the UI offers how many knights can come, the player picks the
  count, knights march from the buildings that can spare them.

## Exit criteria (evidence required)

- [x] Knight fights run the full reference state machine — the
  building assault chain (already a faithful SetFightOutcome port)
  and now the free-fight chain — with the reference fight math,
  seed-deterministic. (SB-39-01 — the Engage/Prepare sub-states are
  condensed to one driven free-fight state; the fight is faithful.)
- [x] The garrison disciplines exist and act: the reproduction
  clock, the serf-to-knight rate, and the two-phase knight cycling
  swap; castle knights wanted already shipped with Phase 15.
  (SB-39-02 — sendStrongest re-sliced into SB-39-03.)
- [x] The player commands attacks: pick a target, see how many
  knights can come, choose the count, watch them march from the
  right buildings. (SB-39-03 — the UI slider rides the device
  gate; the engine API ships.)
- [x] Gold morale in full: the gold ratio plus the CastleScore
  conquest swing, on the 256-tick cadence. (SB-39-04 — the scaffold's
  "conquest feedback on CastleKnightsWanted" was wrong; the reference
  feeds conquest into morale via CastleScore, ported here. The
  military-score score tail is Phase 41 ledger.)
- [ ] On-device: the maintainer wins and loses a fight he ordered,
  and calls the war game right. (SB-39-05, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-39-01 | The full fight | done | story-01-the-full-fight.md | evidence-story-01.md |
| SB-39-02 | The garrison disciplines | done | story-02-the-garrison-disciplines.md | evidence-story-02.md |
| SB-39-03 | The commanded attack | done | story-03-the-commanded-attack.md | evidence-story-03.md |
| SB-39-04 | Gold and morale in full | done | story-04-gold-and-morale-in-full.md | evidence-story-04.md |
| SB-39-05 | The device gate | backlog | — | — |

## Boundaries

- EscapeBuilding/Scatter ride Phase 38 with burning, where the
  audit placed them (row 12).
- UnderAttack/LoseFight/WinFight notifications ride Phase 41 with
  the messenger (addendum row 19); this phase emits the events.
