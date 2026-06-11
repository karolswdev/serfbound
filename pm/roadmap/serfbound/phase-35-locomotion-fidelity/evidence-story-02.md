# Evidence — SB-35-02 — Doors and Slides

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `roadBuildingSlope` (the reference Serf.RoadBuildingSlope, 25
    entries, 5..22);
  - `#leaveBuilding(serf, buildingPosition, slope, nextState)` — the
    DownRight door slide onto the flag, counter scaled
    `(slope * counterFromAnimation) >> 5`;
  - `#enterBuilding(serf, building, nextState)` — the UpLeft slide
    with `slopeLength` as the door threshold (finished buildings by
    type, sites at 1); completion lands in `nextState`, and a
    garrisoning knight's occupation bookkeeping (requested→knights,
    first-knight land claim) moved INTO the door crossing;
  - every instant teleport replaced: profession settle, knight
    garrison, builder onto the site, generic entry, the castle exit
    (real slope 13, was hardcoded 30), and the harvest cycle's
    out-the-door / home-through-the-door legs (the product emits at
    the flag, with the serf).

## Verification artifacts

```
engine gate (new): "workers pass through the door"
  - the lumberjack's lifecycle must contain enteringBuilding before
    working, then leavingBuilding standing on the flag tile
  - pre-door code (stash-verified): FAILS at "the worker settled in
    THROUGH the door"
  - with the doors: PASSES

npm run test:unit -> exit=0, no failures (knight occupation and
  military suites absorb the door delay)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

The slide renders with the walking animation between the two tiles;
the dedicated door sprite offsets (the reference's per-building door
pixel coordinates) are not modeled — the door is the DownRight edge.
Transporters delivering INTO a building (resources at the castle)
still hand off at the flag, not through the door; that flow belongs
to Phase 36's MoveResourceOut work.

## Acceptance criteria — re-checked

- [x] Door states in the worker lifecycle, slide on the flag tile,
  gate discriminating.
- [x] Full unit sweep + release gates green.
