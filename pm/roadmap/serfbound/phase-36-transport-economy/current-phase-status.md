# Phase 36 — The Transport Economy in Full

**Last updated:** 2026-06-11 (SB-36-03 done: the maintainer's
split-road bug is fixed at the system level — both halves staff
themselves; felled-wood decay bridged from Phase 37; the AI links
to the nearest flag).
**Status:** in progress.

## Goal

The reference's logistics, not a sketch of them: resources are
walked out of inventories by serfs, flags schedule their slots per
direction over the real flag-network search, splitting a road
reassigns its transporter and staffs the new half, busy roads earn
more transporters, idle ones park and wake. Kills "materials appear
at the castle door" and the unstaffed split road at the root.

## Reference ground truth

- Inventory.OutQueue (2 slots) → Serf MoveResourceOut →
  WaitForResourceOut → DropResourceOut: a serf carries the resource
  out the door and drops it at the flag (Inventory.cs, Serf.cs).
- Flag slots: 8 × {type, direction, destination};
  ScheduleSlotToKnownDest (BFS over the flag network) and
  ScheduleSlotToUnknownDest; per-direction pickup scheduling flags
  (Flag.cs).
- Game.BuildFlagSplitPath: FillPathSerfInfo both halves, PathSplited
  reassigns the existing transporter, the other half requests its
  own (Game.cs/Flag.cs) — the maintainer's split-road bug, verbatim.
- MaxTransporters by length category {1,2,3,4,6,8,11,15}; idle
  park/wake: IdleOnPath, WakeAtFlag, WakeOnPath, WaitCounter > 3 →
  TransporterToServe (Serf.cs).
- Building.Stock {available, requested, maximum, priority} with the
  dynamic `policy >> (8 + total)` priorities (Building.cs).

## Exit criteria (evidence required)

- [x] A resource leaving the castle is carried out the door by a
  serf — nothing materializes on a flag. (SB-36-01)
- [ ] Flag slots schedule per direction over the reference network
  search; congested flags coordinate multiple serfs. (SB-36-02)
- [x] Splitting a road reassigns the transporter to one half and
  staffs the other; gated by a test that builds a flag mid-road and
  watches both halves carry. (SB-36-03)
- [ ] Roads staff up to the reference MaxTransporters by length;
  idle transporters park and wake. (SB-36-04)
- [ ] Building stocks split available/requested with reference
  priorities. (SB-36-05)
- [ ] On-device: the maintainer splits a live road and watches both
  halves work. (SB-36-06, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-36-01 | Out the castle door | done | story-01-out-the-castle-door.md | evidence-story-01.md |
| SB-36-02 | Flag scheduling | backlog | — | — |
| SB-36-03 | The split road staffs itself | done | story-03-the-split-road-staffs-itself.md | evidence-story-03.md |
| SB-36-04 | Park, wake, and reinforce | backlog | — | — |
| SB-36-05 | Stock and priorities | backlog | — | — |
| SB-36-06 | The device gate | backlog | — | — |
