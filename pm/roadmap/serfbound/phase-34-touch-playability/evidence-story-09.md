# Evidence — SB-34-09 — Rising Under the Hammer

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/game-world.ts` — `applyBuilderWork` no longer
  banks time: work toward a material accrues only while one is on
  site (`materialWorkTicks`, a new building field, initialized at
  both allocation sites); `constructionFraction(building)` exposes
  the continuous 0..1 visible progress (consumed + the material
  under the hammer, over the build total).
- `packages/engine/src/checksum.ts` — `materialWorkTicks` hashes
  with the rest of the building state.
- `packages/app/src/render-layer-scene.ts` — `cropTop` on sprite
  primitives: the quad hides the top fraction (position + texcoord),
  the reference build-progress mask as a crop.
- `packages/app/src/landscape-scene.ts` — construction staging:
  cross (leveling) → corner stone (`0x91`, now composed into the
  atlas) + frame revealing through fraction 0..0.5 → whole frame +
  building revealing through 0.5..1 → done.
- `packages/app/src/main.ts` — the road builder extends exactly one
  segment when the tap is adjacent to the path's end (pathfinder
  capped at `maxLength: 1` — invalid single segments reject), and
  pathfinds for distant taps.

## The "architect" diagnosis

The builder serf never leaves the site: `#handleBuilding` holds
`state = building` until `isDone`. What the maintainer watched was
(a) transporters hauling each plank castle → site — authentic
logistics — and (b) the building snapping a whole phase the moment a
delivery landed, because `applyBuilderWork` had banked hundreds of
work ticks against zero materials. Cause and effect looked like "the
phase starts when someone comes out of the castle." With work gated
on materials, phases rise visibly tick by tick while the builder
stands hammering, and pause honestly between deliveries.

## Verification artifacts

```
engine gate (new): "builder work never banks"
  - 500 work ticks with no materials -> fraction stays 0
  - first plank: fraction 0 -> 0.17 -> 0.33 (monotonic), material
    consumed exactly at 30 ticks, isDone only after the second
scene gate (new): "construction rises bottom-up"
  - fraction 0.25 -> cornerstone (mo:145) + frame cropTop 0.5
  - fraction 0.75 -> frame whole + building cropTop 0.5
two-hop logistics probe (real engine, castle -> mid -> site):
  frame at step 323, done at step 717, consumed 2, delivered {7:2}

node --test engine-world-commands + engine-serfs +
  app-landscape-scene + app-road-rendering +
  engine-lockstep-checksum -> pass, 0 fail
touch-playability + mobile-play + decoded-scene -> 9 passed
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)

Real-data run (SPAU.PA, DPR 3, genuine touch): hut placed by popup,
site flag roaded to the network, construction captures show the
cross standing while the builder walks in (construction is honest
wall-clock work — the reference pace).
```

## Honest limits

The reveal is the reference *mask* technique on our simplified
progress model (leveling → materials), not the bit-shift progress
word of the original. The builder has no hammering animation frames
yet — he stands at the site while the building rises; serf work
animations are their own future story. Whether the pace and the rise
read right on the phone is SB-34-05's verdict.

## Acceptance criteria — re-checked

- [x] No banked work; gradual, monotonic, delivery-gated progress.
- [x] Progressive bottom-up reveal staged like the reference.
- [x] Adjacent tap = one segment; distant tap = pathfind.
- [x] Two-hop logistics complete.
