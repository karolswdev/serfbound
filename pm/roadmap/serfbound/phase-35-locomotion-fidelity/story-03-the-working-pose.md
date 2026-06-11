# SB-35-03 — The Working Pose

- **Project:** serfbound
- **Phase:** 35
- **Status:** done
- **Depends on:** SB-35-01
- **Unblocks:** SB-35-04
- **Owner:** unassigned

## Problem

The audit's row 3, and the maintainer's "chopping it down
instantaneously": work was a flat 60-tick dwell in a walking pose,
and the tree flipped to a stub in one step. The reference fells a
tree in five visible stages (animation 116+stage), laying the
felled-trunk map objects as it goes, and the stonecutter takes one
1535-tick cut per visit, shrinking the pile a single slice.

## What shipped

- **Logging in five stages**: each stage runs its counter, lays the
  next felled object (pines fall as felled pines, trees as felled
  trees — the family holds through the fall), and drives animation
  116+stage; after stage five the trunk lies as FelledTree4 /
  FelledPine4 and the serf walks the lumber home. (The trunks remain
  until Phase 37's ambience decays them to stubs — recorded.)
- **Stonecutting by slices**: one cut per visit (animation 123); the
  pile shrinks Stone0 → … → Stone7 → gone across eight visits, one
  stone carried home each time.
- **The castle stops entombing products** (a recorded Phase-36
  down-payment): the reference InventoryScheduleCounter re-export,
  minimal — banked stock with a reachable, wanting consumer leaves
  the castle again on a 64-tick cadence (planks/stones keep a small
  construction reserve). Without it, anything produced before its
  consumer existed banked forever — the chain suites exposed wheat,
  flour, and bread entombed while the mill, baker, and miners
  starved.

## Interim pacing (recorded)

Stage counters ship at one quarter of the reference values
([255,31,191,191,63] vs [1023,31,767,767,255]; 383 vs 1535): the
condensed transport layer (single transporters, no priorities)
starves the deep chains at full durations. The true constants return
inside Phase 36's exit gate, where throughput exists to carry them.

## Acceptance criteria

- [x] A real lumberjack's target passes through ≥2 visible felled
  stages and ends as the lying trunk — never tree → gone in a step
  (engine-gated).
- [x] Stones shrink one slice per visit (engine logic; the
  per-slice product rides the same gate suite).
- [x] The full unit sweep green, including the chain suite running
  the deeper economy on the re-export sweep.
