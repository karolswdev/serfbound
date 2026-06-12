# Phase 39 — Knight Fidelity

**Last updated:** 2026-06-11 (scaffolded from the reference parity
audit addendum; row 13 comes off the "later" pile).
**Status:** scaffolded.

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
  every 256 ticks; conquest feedback (CastleKnightsWanted +1 per
  conquered building, −1 on loss).
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

- [ ] Knight fights run the full reference state machine — both the
  building assault chain and the free-fight chain — with the
  reference fight math, parity-tested against seeded fixtures.
  (SB-39-01)
- [ ] The garrison disciplines exist and act: castle knights wanted,
  serf-to-knight rate, send strongest/weakest, and the two-phase
  knight cycling swap. (SB-39-02)
- [ ] The player commands attacks: pick a target, see how many
  knights can come, choose the count, watch them march from the
  right buildings. (SB-39-03)
- [ ] Gold morale in full: MapGoldMoraleFactor on the 256-tick
  cadence, conquest feedback on CastleKnightsWanted. (SB-39-04)
- [ ] On-device: the maintainer wins and loses a fight he ordered,
  and calls the war game right. (SB-39-05, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-39-01 | The full fight | backlog | — | — |
| SB-39-02 | The garrison disciplines | backlog | — | — |
| SB-39-03 | The commanded attack | backlog | — | — |
| SB-39-04 | Gold and morale in full | backlog | — | — |
| SB-39-05 | The device gate | backlog | — | — |

## Boundaries

- EscapeBuilding/Scatter ride Phase 38 with burning, where the
  audit placed them (row 12).
- UnderAttack/LoseFight/WinFight notifications ride Phase 41 with
  the messenger (addendum row 19); this phase emits the events.
