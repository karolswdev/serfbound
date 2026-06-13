# SB-39-04 — Gold and Morale in Full

- **Project:** serfbound
- **Phase:** 39
- **Status:** done
- **Depends on:** SB-39-02
- **Unblocks:** SB-39-05
- **Owner:** unassigned
- **Story ID note:** the scaffold's "conquest feedback on
  CastleKnightsWanted" is corrected here — the reference feeds
  conquest into morale via CastleScore, not the wanted count.

## Problem

Serfbound updates knight morale on the gold ratio only, every 1024
ticks. The reference does it every 256, and the gold ratio is only
the first half: a CastleScore counter — +1 when you take an enemy
castle, −1 when you lose yours — then shoves morale up or down, so
the act of conquest itself makes your knights braver and a lost
castle makes the survivors falter. That CastleScore swing is the
"conquest feedback" the SB-39-02 scaffold note misplaced.

## Reference ground truth

- Game.cs 389–395: `knightMoraleCounter -= delta`; on underflow,
  UpdateKnightMorale runs and the counter resets +256.
- Player.cs UpdateKnightMorale 1535–1542: after the gold morale,
  `castleScore < 0 → morale = max(1, morale − 1023)`;
  `castleScore > 0 → morale = min(morale + 1024 * castleScore,
  0xffff)`.
- Player.cs BuildingCaptured 1145–1148 / BuildingDemolished
  1186–1192: castle capture `++castleScore` on the attacker; a
  demolished own castle `--castleScore`.

## What ships

- `castleScore` on WorldPlayer; the conquest paths drive it — a
  captured enemy castle raises the conqueror's, a fallen own castle
  lowers the owner's.
- The castle-score adjustment in `updateKnightMorale`, after the
  gold ratio, exactly the reference clamps.
- The morale sweep runs on the 256-tick cadence.

## Acceptance criteria

- [x] Two players with identical gold get different morale once one
  has taken an enemy castle (castleScore raises it) and the other
  has lost one (castleScore craters it toward the floor)
  (engine-gated, stash-verified).
- [x] Morale refreshes on the 256-tick cadence, not 1024
  (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The reference's military-score tail of UpdateKnightMorale (the
  TotalMilitaryScore shift-combination feeding the player's
  displayed score) is statistics, not combat — it rides Phase 41's
  ledger (recorded).
- CastleScore is a plain signed counter (the reference's sbyte);
  the +1/−1 swings are the only drivers ported.
