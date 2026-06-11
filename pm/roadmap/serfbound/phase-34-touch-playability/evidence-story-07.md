# Evidence — SB-34-07 — The Road and the True Tap

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## The phantom sprite, proven against the maintainer's data

```
node probe over serfbound-local-data SPAU.PA (demo, DOS EN):
  button 0..24  32x32 opaque-px 1024
  button 25 MISSING
  button 26..29 MISSING
Reference Freeserf.Core/UI/PanelBar.cs ButtonId:
  ... BuildMineStarred = 23, BuildRoadStarred = 24  (enum ends at 24)
```

`panelButtonId.buildRoadStarred` was 25 — a sprite that exists in no
archive. Arming road mode therefore drew nothing in the slot: the
"rectangle transparent to the background."

## Files touched

- `packages/app/src/panel-bar.ts` — `buildRoadStarred: 24`;
  `PanelBuildPossibility` gains `"road"` → the build slot shows the
  road button when the selection stands on an own flag (reference
  Interface.BuildPossibility behavior).
- `packages/app/src/landscape-scene.ts` — height-aware
  `screenToMapTile`: picks the tile whose drawn apex is nearest the
  tap (search window covers the max 124px height lift). The flat
  picker selected the wrong tile on hills while the cursor drew at
  the lifted apex — the maintainer's "cursor does not correspond to
  where I tapped."
- `packages/app/src/main.ts` — build-slot tap on an own flag arms
  road mode pre-seeded with that flag (`awaiting-end`); road
  arm/start/built/rejected and the castle confirm all speak through
  the in-canvas notice (the old prompts wrote only to dev-ledger
  elements players never see — "it just does not do anything" was a
  silent rejection); `onNotice` handler threaded into the pointer
  interaction layer.
- `packages/app/src/strings.ts` — notice strings (EN/DE):
  castleConfirm, roadPickStart, roadPickEnd, roadBuilt, roadFailed,
  roadEnded.
- `packages/test-support/src/decodable-pa-fixture.ts` — exactly 25
  panel buttons, mirroring the DOS data.
- `tests/ci/app-panel-bar.test.mjs` — starred road = 24; possibility
  "road" maps the build slot to the road button.
- `tests/ci/app-landscape-scene.test.mjs` — the round-trip now feeds
  the TRUE screen point (no height compensation) and must land on
  the same tile.
- `tests/ci/app-ui-art.test.mjs` — 25 decoded panel buttons.
- `tests/browser/decoded-scene.spec.ts` — armed road slot asserts 24.
- `tests/browser/touch-playability.spec.ts` — punch 5 additionally
  asserts the player-visible notice ("TAP YOUR STARTING FLAG").

## Verification artifacts

```
Real-data run (SPAU.PA, iPhone-13-like, DPR 3, genuine touch):
  road-mode: awaiting-start
  notice: TAP YOUR STARTING FLAG     <- rendered in-canvas, game font
  artifacts/story-07-road-armed.png  <- the starred road button drawn
                                        (the former transparent hole)
  popup: buildBasic                  <- popup flow intact after toggle

node --test (landscape-scene, panel-bar, ui-art, view-scale, popup,
  road-rendering) -> pass, 0 fail
npm run ci:release -> exit=0 (captured directly; the first run caught
  decoded-scene.spec pinning the phantom 25 — updated to 24, re-run
  green)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

Height-aware picking is gated at the apex level; whether it "feels
right under the thumb" on real hills is the maintainer's device call
(SB-34-05). The flag→road affordance follows the reference flow; the
full multi-segment road walk of the original (step-by-step pathing)
remains the Phase 27-era refinement it always was — roads here are
flag-to-flag with engine pathfinding.

## Acceptance criteria — re-checked

- [x] True-point round-trip picking (unit-gated).
- [x] Armed road button renders (24; fixture mirrors reality).
- [x] Own flag → build slot becomes the road act, pre-seeded.
- [x] Road flow and castle confirm speak as in-canvas notices.
