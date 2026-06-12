# Evidence — SB-36-04 — Park, Wake, and Reinforce

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `maxTransportersByCategory` (the reference Flag.MaxTransporters
    table);
  - `#sweepTransportStaffing` (64-tick cadence): per road,
    `#roadServers` counts the serfs anchored to either end and how
    many sit idle; `#scheduledOver` counts slots routed across; a
    busy road with backlog > 1 reinforces up to the length cap;
    `serfRequested` bits are serviced (pool-slack guarded) and
    at-cap requests are dropped as unsatisfiable.

## Verification artifacts

```
engine gate (new): "a congested road reinforces up to its length
  cap, and requests are serviced"
  - a staffed 5-segment road flooded with 4 destined resources must
    pull a SECOND transporter (cap 2 for its length category)
  - a recorded serfRequested bit on a fresh unstaffed road must
    dispatch a serf and clear
  (the test's first draft demanded growth past the cap on an at-cap
  road — wrong on the test's side; at-cap requests are correctly
  dropped, and the gate now exercises a fresh road instead)
npm run test:unit -> exit=0
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Reinforcement under load, capped by length category.
- [x] Requests serviced and cleared.
- [x] Full sweep + release gates green.
