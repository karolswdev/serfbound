# Phase 40 — Boats and Waterways

**Last updated:** 2026-06-11 (scaffolded from the reference parity
audit addendum, row 17).
**Status:** scaffolded.

## Goal

Water carries cargo. The boatbuilder — today a buildable building
with a sprite and no work cycle, producing a resource nothing
consumes — builds boats from planks through the reference's
BuildingBoat cycle; roads laid over water become water paths; a
sailor takes the crossing with the cargo in a boat. The reference's
plank distribution already reserves the boatbuilder's share
(SB-36-07); this phase spends it.

## Reference ground truth (Freeserf.Core)

- Serf.cs: Sailor serf type; FreeSailing (7709–7718) and LostSailor
  (7647–7708) states; water detection for movement (8037–8048).
- Serf.cs 8556–8617: BuildingBoat — the boatbuilder's 9-step cycle
  consuming planks and producing the boat resource.
- Flag.cs / FlagState.cs 64–100: endpoint flags track land vs water
  per direction; a water path requires a boat and a sailor instead
  of a walking transporter.
- Building.cs 1525–1528: the boatbuilder's plank stock rides
  PlanksBoatbuilder distribution.
- Map.cs 1501–1518: IsInWater and the water-road validity rules
  (both endpoint flags on land, the path over water).

## Exit criteria (evidence required)

- [ ] The boatbuilder works: planks in, the reference build cycle,
  boats out — the no-op building is dead. (SB-40-01)
- [ ] A road over water is a water path: it demands a boat and a
  sailor, and cargo crosses by boat at reference pacing; the
  FreeSailing/LostSailor states exist for the open-water cases.
  (SB-40-02)
- [ ] On-device: the maintainer spans a bay, watches the boat row
  the cargo across, and calls it right. (SB-40-03, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-40-01 | The boatbuilder builds boats | backlog | — | — |
| SB-40-02 | Sailors on the water path | backlog | — | — |
| SB-40-03 | The device gate | backlog | — | — |
