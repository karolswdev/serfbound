# Phase 36 — The Transport Economy in Full

**Last updated:** 2026-06-12 (SB-36-07 done: the priority book is
player data — flag/inventory/tool priorities and the distribution
splits on every WorldPlayer with the reference defaults, consumed by
pickup, the swap, the stock book, the toolmaker's weighted draw, and
the export sweep; inventory resource modes in/stop/out ship with it.
Earlier today: SB-36-02 flag scheduling, SB-36-05 stock priorities,
and SB-35-03's pacing interim retired).
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
- PlayerSettings.cs: the 26-entry flag and inventory transport
  priority lists the scheduler consults, the distribution splits
  (food to 4 mines; plank construction/boatbuilder/toolmaker; steel;
  coal 3-way; wheat), 9 tool-making priorities, inventory in/stop/out
  modes for resources and serfs — engine data with reference
  defaults; the player-facing sliders ride Phase 41.
- Player.cs emergency program: a castle short of planks/stones
  collapses construction priorities to lumberjack/sawmill/
  stonecutter until supply recovers (EmergencyActive/Neutral).

## Exit criteria (evidence required)

- [x] A resource leaving the castle is carried out the door by a
  serf — nothing materializes on a flag. (SB-36-01)
- [x] Flag slots schedule per direction over the reference network
  search; congested flags coordinate multiple serfs. (SB-36-02 —
  the per-direction seeding yields loaded directions, pickup takes
  the highest flag priority, and SB-36-04's backlog measure now
  reads the real scheduling.)
- [x] Splitting a road reassigns the transporter to one half and
  staffs the other; gated by a test that builds a flag mid-road and
  watches both halves carry. (SB-36-03)
- [x] Roads staff up to the reference MaxTransporters by length;
  requests are serviced (the reference park/wake choreography stays
  condensed — recorded). (SB-36-04)
- [x] Building stocks split available/requested with reference
  priorities. (SB-36-05 — the stock book, the decay formula, and
  priority-ranked dispatch in production, inventory export, and
  unknown-destination routing.)
- [ ] On-device: the maintainer splits a live road and watches both
  halves work. (SB-36-06, the device gate)
- [x] The priority book exists as engine data with reference
  defaults — flag/inventory transport priority lists consulted by
  the scheduler, distribution splits feeding stock priorities, tool
  priorities feeding the toolmaker, inventory in/stop/out modes
  honored by dispatch. (SB-36-07 — serf modes ride Phase 38;
  planksConstruction waits for SB-36-08 to consume it.)
- [ ] A castle short of planks or stones enters the emergency
  program and recovers from it. (SB-36-08, addendum row 21)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-36-01 | Out the castle door | done | story-01-out-the-castle-door.md | evidence-story-01.md |
| SB-36-02 | Flag scheduling | done | story-02-flag-scheduling.md | evidence-story-02.md |
| SB-36-03 | The split road staffs itself | done | story-03-the-split-road-staffs-itself.md | evidence-story-03.md |
| SB-36-04 | Park, wake, and reinforce | done | story-04-park-wake-reinforce.md | evidence-story-04.md |
| SB-36-05 | Stock and priorities | done | story-05-stock-and-priorities.md | evidence-story-05.md |
| SB-36-06 | The device gate | backlog | — | — |
| SB-36-07 | The priority book | done | story-07-the-priority-book.md | evidence-story-07.md |
| SB-36-08 | The emergency program | backlog | — | — |
