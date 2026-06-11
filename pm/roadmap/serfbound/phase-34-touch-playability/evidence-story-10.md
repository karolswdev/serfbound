# Evidence — SB-34-10 — A Settlement of Individuals

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `serfBodyOffset(serf, world)`: the reference
    RenderSerf.GetActiveSerfBody offsets, condensed — knights
    0x7800 + 0x100·rank, builder 0x500, profession offsets per
    workplace type (lumberjack 0xb00, stonecutter 0xd00, miners
    0x1800, fisher 0x2c00, farmer 0x3d00, …), and the carry table
    indexed by Resource.Type + 1 for loaded transporters (plank
    0x700, stone 0x800, …);
  - `#workHarvest` rebuilt as the visible outdoor cycle: rest inside
    (half the old cycle), walk out to the nearest target, dwell 60
    ticks AT it, mutate it under the worker's feet, walk the product
    home; `#stepToward` greedy free-walk paced at the serf walking
    rhythm, ghosting off the collision map (a dwelling stonecutter
    must never wall off the transporters behind him), with the
    target tile always enterable — the walk-home wedged one tile
    from the hut until the economy gate caught lumber flow at zero
    and the sawmill idle at a 3.9M-tick counter.
- `packages/app/src/render-layer-scene.ts` — torso decode widened to
  the full ~600-body range and heads to 640 (48 decoded bodies
  dressed every serf the same); `rawResourceObjects` decodes
  game_object 135+type for flag stacks.
- `packages/app/src/landscape-scene.ts` — the serf body offset
  applies to walking frames before the appearance tables; flags
  stack their slot resources at the reference ResPos offsets;
  `res:` sprites composed into the atlas.
- `packages/app/src/main.ts` — serfs pass their `serfBodyOffset`;
  workers resting inside their building (state working, phase 0)
  are hidden — the reference hides serfs indoors.
- `packages/test-support/src/decodable-pa-fixture.ts` — profession
  torso bank bases and the 26 resource sprites, so CI exercises the
  dressed paths.

## Verification artifacts

```
engine gates (new):
  "serfs dress for their profession and carry visibly" — builder
    0x500, lumberjack 0xb00, stonecutter 0xd00, knight rank 2
    0x7a00, plank carrier 0x700, stone carrier 0x800
  "harvesters walk out, work the target in the open, and walk the
    product home" — leftHome true, workedOutside true (the worker
    stood AT the tree, state working, phase 2)

economy regression (the gates caught two real bugs en route):
  walk-home wedge -> "every chain runs concurrently" failed with
  woodGain 0; fixed (target always enterable) -> full suite green
npm run test:unit -> 251 passing, 0 failing
touch-playability + mobile-play -> 8 passed (genuine touch, DPR 3)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)

Real-data run (SPAU.PA, DPR 3, genuine touch): the full settlement
loop — castle, road builder, hut by popup, site roaded in — with a
loaded transporter visible on the road mid-haul and BUILDING
COMPLETE reached (artifacts/story-10-settlement-loop.png).
```

## Honest limits

Work-dwell animation frames (the chopping/hammering poses, 0x80+)
are not yet driven — the worker stands at the target through the
dwell in his walking pose. Mines and the fisher keep the condensed
indoor cycle this round; the lumberjack and stonecutter walk out.
The device verdict on how it all reads stays with SB-34-05.

## Acceptance criteria — re-checked

- [x] Reference profession/carry offsets, unit-gated.
- [x] Harvesters visibly out and at the target, engine-gated.
- [x] Flag stacks render; fixture + real data carry the sprites.
- [x] Economy suites green at the new pacing.
