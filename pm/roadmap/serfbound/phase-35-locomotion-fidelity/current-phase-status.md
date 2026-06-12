# Phase 35 — Locomotion and the Working Pose

**Last updated:** 2026-06-12 (SB-35-03's recorded interim is
retired: the reference work-stage constants — logging
[1023, 31, 767, 767, 255], stonecutting 1535 — are restored now
that Phase 36's transport throughput exists, and every chain suite
holds at full durations. Previously: SB-35-03 done 2026-06-11).
**Status:** in progress — SB-35-04, the device gate, remains.

## Goal

One movement system, the reference's: every serf walk — roads,
free-walking, the harvest round trip — paced by the reference
animation counter tables with slope effects; serfs pass through
building doors with the leave/enter slides; work has poses (the
logging five-stage tree fall with felled-tree objects on the map,
stonecutting, planting); turns and waits animate. This kills the
"teleporting lumberjack" at the root: there is no second, faster
movement code path left to drift.

## Reference ground truth (Freeserf.Core/Serf.cs)

- Walking rows 0..80 with per-frame counters 255..1023; waiting
  81..86 at 127; transporter turns 110..115 at 63.
- Slope: `counter += (slope * counterFromAnimation[anim]) >> 5`;
  RoadBuildingSlope per building type (5..22); leaving uses
  `31 - slope`.
- Logging: frames 116..120 (counters 1023, 31, 767, 767, 255), the
  tree becomes FelledTree0..4 stage by stage, then the serf carries
  the lumber home. StoneCutting: anim 123, 1535 ticks. Sawing: 124.
- LeavingBuilding/EnteringBuilding: the door at DownRight,
  slide offsets, joinPos collision handling.

## Exit criteria (evidence required)

- [x] The harvest walk and every other off-road walk run through the
  same counter-table pacing as road walking — the fixed-tick stepper
  is deleted. (SB-35-01)
- [x] Building entry/exit: door, slides, slope-scaled counters; a
  serf is never teleported into or out of a building. (SB-35-02)
- [x] Logging fells trees in the reference's five visible stages
  with felled-tree map objects; stonecutting cuts by slices.
  (SB-35-03 — the interim quarter-duration counters were retired
  2026-06-12 with Phase 36's throughput in place; the reference
  constants run now. Planting poses ride Phase 38 with the
  forester's outdoor cycle.)
- [ ] On-device: the maintainer watches a lumberjack's full round
  trip and calls the pace right. (SB-35-04, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-35-01 | One walking system | done | story-01-one-walking-system.md | evidence-story-01.md |
| SB-35-02 | Doors and slides | done | story-02-doors-and-slides.md | evidence-story-02.md |
| SB-35-03 | The working pose | done | story-03-the-working-pose.md | evidence-story-03.md |
| SB-35-04 | The device gate | backlog | — | — |

## Decisions made (this phase)

- 2026-06-11 — No second movement code path, ever: any state that
  moves a serf must run through the shared counter-table walker.
