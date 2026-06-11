# SB-35-01 — One Walking System

- **Project:** serfbound
- **Phase:** 35
- **Status:** done
- **Depends on:** none (first story of the parity-audit sequence)
- **Unblocks:** SB-35-02, SB-35-03
- **Owner:** unassigned

## Problem

The parity audit's row 1, and the maintainer's "the lumberjack is
teleporting to the tree in a couple of milliseconds": road serfs
walk on the reference animation counter tables (flat 255 ticks per
tile, slope rows up to 1023), but the harvest walk added in SB-34-10
bypassed them with a fixed 8-ticks-per-tile ghost stepper — a
30× speedup, a second movement system, and exactly the kind of
divergence the audit exists to kill.

## What shipped

The ghost stepper is deleted. Outdoor harvest walking now runs
through `#freeWalkToward`: greedy free-walk routing (the condensed
reference FreeWalking, same as knight marching) where **every step
is taken through the shared `#changeDirection` walker** — reference
animation rows, counter-table pacing, slope effects, collision
waiting and crossing swaps, the real collision map. Workers going
back inside clear their collision entry like settling serfs.

The phase decision is enforced by the gate: any state that moves a
serf must ride the shared walker. The next code path that tries a
private stepper fails the median-pacing test the way the old one
does ("median 8, steps 8,8,8,8").

## Honest limits

The greedy descent stays (the full reference FreeWalking distance
bookkeeping is not this story); the 60-tick work dwell and the
five-stage logging fall belong to SB-35-03; building doors and
slides to SB-35-02.

## Acceptance criteria

- [x] The fixed-tick stepper is deleted; harvest walking paces on
  the reference counter tables (engine-gated: the typical outdoor
  tile costs ≥ 247 ticks; verified to fail on the old stepper at
  median 8).
- [x] The walk wears walking-row animations (< 81) — no synthetic
  poses.
- [x] The economy survives authentic pacing: chains, AI, serfs,
  checksum suites green.
