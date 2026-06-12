# Evidence — SB-36-02 — Flag Scheduling

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `defaultFlagPriorities` (Player.ResetFlagPriority's 26-entry
    pecking order; SB-36-07 moves it into the priority book) and
    `routableResources` (Flag.cs);
  - `#sweepFlagScheduling` (per update): every slot with a resource
    and no scheduled direction is routed — `resourcesWaiting` tiers
    per direction computed first, known destinations through
    `#scheduleSlotToKnownDestination`, destination-less slots through
    `#scheduleSlotToUnknownDestination`;
  - `#scheduleSlotToKnownDestination`: breadth-first over the
    transporter-served network, seeded least-loaded-first from the
    flag's staffed neighbors; no seeds → stay unscheduled and retry;
    seeds but no route → the consumer's in-flight request is released
    and the destination cleared (Game.CancelTransportedResource);
  - `#scheduleSlotToUnknownDestination`: re-homes raw goods to the
    nearest consumer with stock room over the staffed network, else
    the nearest inventory;
  - `#handleIdleOnPath`: pickup is now per-direction — only slots the
    sweep scheduled out the transporter's road, highest flag priority
    first (Flag.PrioritizePickup); the walk-back-empty leg reads the
    far flag's scheduled directions;
  - `#scheduledOver` (SB-36-04's backlog measure) now reads the real
    per-slot scheduling instead of re-deriving routes.
- `packages/engine/src/game-world.ts` — `demolishRoad` ports
  Flag.InvalidateResourcePath: slots scheduled over the dead road at
  both end flags lose their direction and reschedule.

## Verification artifacts

```
engine gates (new), stash-verified failing pre-fix:
  not ok 13 - flag slots schedule per direction and the higher
              priority rides first (SB-36-02)
  not ok 14 - a destination off the staffed network is cancelled and
              the resource carried home (SB-36-02)
  # pass 12 / fail 2   (engine changes stashed, tests kept)

post-fix:
  ok 13 - gold ore in the earlier slot, plank behind it: both slots
          scheduled "Right" by the network search while the
          transporter walks out; the plank (priority 26) is picked up
          first; both deliver.
  ok 14 - lumber at a far flag destined for a disconnected sawmill:
          the sawmill's in-flight request released (1 -> 0), the slot
          re-homed to the castle flag, the lumber carried home into
          stock.
  # tests 14 / pass 14 / fail 0

npm test -> full sweep green (unit + build + 32 browser specs passed)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Per-direction scheduling over the network search, priority
  order at pickup (engine-gated, stash-verified).
- [x] Unreachable destination cancelled and the resource re-homed,
  not wedged (engine-gated, stash-verified).
- [x] Full unit sweep + release gates green.
