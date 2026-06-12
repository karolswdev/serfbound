# SB-36-04 — Park, Wake, and Reinforce

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-03
- **Unblocks:** SB-36-06
- **Owner:** unassigned

## Problem

The audit's row 7: one transporter per road, forever. The reference
staffs busy roads with up to MaxTransporters by length category
{1, 2, 3, 4, 6, 8, 11, 15}, parks idle serfs, and wakes them on
demand — and SB-36-03 started recording `serfRequested` bits with
nothing to service them.

## What shipped

A 64-tick transport staffing sweep, visiting every road once from
its lower-index end:

- **Reinforcement under load**: a road whose end flags hold more
  scheduled work (slots routed across it) than its busy transporters
  can lift gets another serf from the castle — up to the reference
  cap for its length category, pool slack permitting.
- **Request servicing**: recorded `serfRequested` bits dispatch a
  transporter when the pool allows and clear; requests on roads
  already at cap are dropped as unsatisfiable.

## Acceptance criteria

- [x] A flooded 5-segment road (cap 2) pulls a second transporter;
  a recorded request on an unstaffed road is serviced and cleared
  (engine-gated, both legs).
- [x] Full unit sweep + release gates green with the sweep active.

## Honest limits

The reference's park/wake choreography (WaitCounter > 3 →
TransporterToServe, WakeAtFlag/WakeOnPath states, serfs sitting
down mid-path) is condensed: our idle transporters already wait
passably at their flags, and reinforcement triggers on backlog
instead of wait counters. Recorded for the phase's exit review.
