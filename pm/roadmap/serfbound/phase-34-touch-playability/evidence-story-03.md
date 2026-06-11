# Evidence — SB-34-03 — DPR-3 Coordinate Spaces

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## The diagnosis (real data, reproduced before fixing)

A real-SPAU.PA run in an iPhone-13-like context (390x844, DPR 3,
genuine touch) reproduced punch 6 exactly: the build popup opened
with every building cropped to a ~5px sliver. Root cause was not a
DPR coordinate space at all — `compareLandscapeSprite` /
`compareSpritePrimitive` sorted the **UI layer** by `sortY` like the
map layers, so the popup's lower background tile rows (greater y)
drew after — on top of — the building sprites pushed before them.
Broken at every scale since the popup shipped; no gate ever looked
at the build menu's rendered pixels.

- `artifacts/story-03-build-popup-before.png` — the maintainer's
  complaint, reproduced (real data, DPR 3): slivers.
- `artifacts/story-03-build-popup-after.png` — the same run on the
  fixed renderer: every building whole.

## Files touched

- `packages/app/src/landscape-scene.ts`,
  `packages/app/src/render-layer-scene.ts` — the UI layer keeps its
  push (paint) order: background, borders, content; `Array.sort` is
  stable, map layers keep y-sorting.
- `packages/app/src/main.ts` — `renderCurrentScene` publishes
  `data-serfbound-panel-rect` and `data-serfbound-popup-rect`
  ("x,y,w,h" in canvas CSS space) while running, cleared otherwise —
  the gates verify against the same geometry the hit-testing uses.
- `tests/ci/app-popup.test.mjs` — "the popup paints in push order":
  borders and building sprites must appear after every interior
  background tile in the scene's sprite list. Verified to fail on
  the old comparator (`# fail 1`) and pass on the new.
- `tests/browser/touch-playability.spec.ts` — punch 5 un-stubbed:
  road mode engages from a panel-bar tap derived from the published
  rect; punch 6 un-fixme'd: the popup opens by touch, sits fully
  inside the canvas, renders content beyond the background pattern,
  and the flip button cycles pages — all at DPR 3 under genuine
  touch. Honest limit recorded in the spec: the CI fixture's
  building sprites are shallow strips, so the pixel floor cannot
  catch the paint-order crop — the unit gate above owns that truth.

## Verification artifacts

```
node --test tests/ci/app-popup.test.mjs
  old comparator: not ok 6 - the popup paints in push order... # fail 1
  fixed:          # pass 9, # fail 0

npx playwright test touch-playability + mobile-play
  ✓ punch 1: a single tap must not found a castle without confirmation
  ✓ punch 2: the cursor follows the tap, never the corner
  ✓ punch 5: road mode engages from a panel-bar tap at DPR 3
  ✓ punch 6: the build popup fits and its content is hit-true at DPR 3
  ✓ a phone founds a settlement through the authentic UI by touch
  5 passed / 1 from mobile-play

npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Build popup content renders fully; popup fits at DPR 3.
- [x] Published hit rects; road mode and page flip hit-true by touch.
- [x] Real-data before/after captures in artifacts/.
