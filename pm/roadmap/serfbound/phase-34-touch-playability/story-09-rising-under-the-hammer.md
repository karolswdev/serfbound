# SB-34-09 — Rising Under the Hammer

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-08
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Round 6 of the device gate (maintainer, 2026-06-11):

1. "We are missing the building animation, buildings just
   immediately transform to the other phase."
2. "There's also a bug with the architect finishing each phase
   coming back to the castle then start a new phase once coming out
   of the castle."
3. "The road builder is totally not the way it was in the original.
   Yes, I like the way that you can basically supply by tapping
   where the road should end. That should be one of the ways… but
   the other one should be related to how it was originally working."

## What it turned out to be

1. **Buildings snapped because the renderer only knew three states**
   (cross → frame → done) — the reference reveals construction
   bottom-up through a build-progress mask. Shipped: the renderer
   crops sprites top-down (`cropTop`), and sites stage like the
   original — cross while leveling, then the corner stone with the
   frame creeping up through the first half of the work, then the
   building revealing over the finished frame through the second
   half, every 175ms render a sliver taller.
2. **The "architect returning per phase" was banked work snapping on
   delivery.** The builder never actually leaves the site (the serf
   state machine holds him there until the building is done) — but
   `applyBuilderWork` banked unlimited work ticks while materials
   were still in transit, so the moment a transporter arrived the
   building consumed the bank and JUMPED a phase. The figures
   walking castle→site are transporters hauling each plank — and the
   phase used to snap exactly when one arrived, reading as "the
   phase starts when someone leaves the castle." Work now accrues
   only while a material is on site: phases rise under the hammer,
   pause honestly when the site waits for a delivery, and never jump.
3. **The original's stepwise road building is back**: a tap on a
   tile adjacent to the path's end extends exactly that one segment
   (rejected if that single segment is invalid — the reference
   Viewport click), while a distant tap keeps the pathfind-to-tap
   convenience the maintainer asked to keep.

## Acceptance criteria

- [x] Builder work never banks: long hammering with no materials
  leaves the fraction at 0; the first delivery raises it tick by
  tick, monotonic, no snap (engine-gated).
- [x] Construction renders progressively: cornerstone + half-revealed
  frame at fraction 0.25; whole frame + half-revealed building at
  0.75 (scene-gated via `cropTop`).
- [x] An adjacent tap extends exactly one segment; a distant tap
  pathfinds (both in the touch flow).
- [x] Two-hop logistics complete end to end (engine probe: frame and
  completion through castle → mid flag → site).
