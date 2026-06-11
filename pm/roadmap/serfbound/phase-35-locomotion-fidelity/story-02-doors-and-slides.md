# SB-35-02 — Doors and Slides

- **Project:** serfbound
- **Phase:** 35
- **Status:** done
- **Depends on:** SB-35-01
- **Unblocks:** SB-35-03
- **Owner:** unassigned

## Problem

The parity audit's row 2: serfs blinked in and out of buildings.
Profession workers, knights, and builders teleported from the flag
into their building in a single update; the harvest worker appeared
outside his hut from nowhere. Only the castle exit had a slide, with
a hardcoded slope.

## What shipped

The reference door, everywhere. `RoadBuildingSlope` per building
type (5..22) governs both directions: entering slides UpLeft from
the flag into the building, with the slope length marking the point
the serf passes the door and vanishes inside; leaving slides
DownRight from the door onto the flag at `31 - slope` (unfinished
sites: 1 in, 30 out). Routed through it:

- profession workers settling into their workplace;
- knights garrisoning — the occupation bookkeeping (requested → 
  knights, first-knight land claim) now happens as they cross the
  door;
- builders sliding onto their construction site;
- generic serfs entering any building;
- the castle exit (now the castle's real leaving slope, 13, instead
  of the hardcoded 30);
- the harvest cycle: out through the door onto the flag before the
  free walk, home to the flag and in through the door after — the
  product arrives with the serf at the flag.

## Acceptance criteria

- [x] A worker's lifecycle passes through enteringBuilding to settle
  and leavingBuilding to harvest, with the leaving slide standing on
  the flag tile (engine-gated; fails on the pre-door code at "the
  worker settled in THROUGH the door").
- [x] Knight occupation, military suites, and the full unit sweep
  green with the door delay in the loop.
