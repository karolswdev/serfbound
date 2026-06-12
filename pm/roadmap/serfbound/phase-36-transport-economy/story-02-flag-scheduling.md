# SB-36-02 — Flag Scheduling

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-01
- **Unblocks:** SB-36-05, SB-36-06
- **Owner:** unassigned

## Problem

The audit's row 5: the reference schedules every flag slot per
direction over a real network search (Flag.Update →
ScheduleSlotToKnownDestination / ScheduleSlotToUnknownDest), seeds
the search from the least-loaded transporter-served neighbors so
congested directions yield, picks the highest-priority resource
first at pickup (PrioritizePickup over the player's flag
priorities), cancels deliveries whose destinations fall off the
staffed network, and re-homes orphaned resources to a consumer or
the nearest inventory. Serfbound's transporters instead re-derive a
greedy route per slot per idle tick: `scheduledDirection` exists in
the flag state and is never set, nothing is prioritized, and a slot
whose destination is unreachable (or zeroed by a capture) wedges in
its slot forever.

## Reference ground truth

- Flag.cs Update (930–1036): resourcesWaiting tiers per direction,
  unscheduled slots routed known/unknown.
- Flag.cs ScheduleSlotToKnownDestination (1686–1823): multi-source
  BFS seeded idle-directions-first over transporter-served paths;
  no sources → stay unscheduled and retry; sources but no route →
  destination cancelled (Game.CancelTransportedResource).
- Flag.cs ScheduleSlotToUnknownDest (1577–1668) + routableResources
  (1546): raw goods to a wanting building, else nearest inventory.
- Flag.cs PrioritizePickup (230–255) + Player.ResetFlagPriority
  (379–410): the 26-entry default transport pecking order.
- Flag.cs InvalidateResourcePath via DeletePath (197–222): slots
  scheduled over a dead road lose their direction and reschedule.

## What ships

- A per-update flag scheduling sweep: every slot with a resource
  and no scheduled direction is routed — known destinations over
  the reference's seeded BFS on the staffed network, unknown
  destinations re-homed (consumer with stock room nearest-first,
  else nearest inventory).
- Per-direction pickup: idle transporters take only slots scheduled
  out their road, highest reference flag priority first.
- The failure path: a destination off the staffed network is
  cancelled (consumer's in-flight request released) and the
  resource re-homed; road demolition invalidates scheduled
  directions at both end flags.

## Acceptance criteria

- [x] Two resources scheduled out the same direction ride in
  reference priority order (plank before gold ore), and slots carry
  a scheduled direction set by the network search (engine-gated).
- [x] A resource whose destination is not on the staffed network
  has the consumer's in-flight request cancelled and is carried
  home to the inventory — not wedged (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The reference's other-endpoint slot register
  (ScheduleOtherEndpoint / the wake-the-other-end bookkeeping) is
  folded into pickup-time prioritization — equivalent choice, no
  park/wake choreography (recorded with SB-36-04's condensation).
- Flag priorities are the reference defaults as a module constant;
  SB-36-07 moves them into the player's priority book.
- Unknown-destination consumer choice is nearest-first; the
  reference ranks by building stock priority, which lands with
  SB-36-05.
- A destination-less resource sitting on its own inventory's flag
  stays put (the reference's forth-and-back bounce is not ported).
