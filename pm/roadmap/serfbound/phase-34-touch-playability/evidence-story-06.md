# Evidence — SB-34-06 — The Visible World

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/landscape-scene.ts` —
  - **the map cursor**: `LandscapeSceneOptions.selected` draws the
    decoded 5-point cursor centered AT the selected tile on the
    markers layer; the corner-pinned HUD copy is gone (it was the
    literal cause of "the cursor is ALWAYS stuck in a corner");
  - **construction visibility**: a building site at progress 0
    renders `constructionCrossSprite` (reference CrossSprite 0x90) —
    placement is visible the instant it happens, exactly like the
    original;
  - **waving flags**: world flags and built-structure flags render
    `objflag:{(tick>>3)&3}` (reference RenderFlag, map objects
    128..131), composed into the atlas with shadows; the static
    sprite stays as fallback.
- `packages/app/src/main.ts` — `renderScene` threads
  `selectedInteraction.tile` into the scene; `onSelection` repaints
  immediately so the tap lands visibly between animation ticks;
  exports for the new constants.
- `packages/test-support/src/decodable-pa-fixture.ts` — the fixture
  now carries map objects 0x90..0xc0 (cross included) and all four
  flag frames with shadows, so CI sees what the phone sees.
- `tests/ci/app-landscape-scene.test.mjs` — flag frames gated
  frame-by-frame (0/8/16/24 → frames 0/1/2/3, 32 wraps); a real
  placed lumberjack at progress 0 renders the cross.
- `tests/ci/app-ui-art.test.mjs` — the corner cursor is asserted
  ABSENT; the cursor renders at a selected tile on the markers layer.
- `tests/ci/app-view-scale.test.mjs`,
  `tests/ci/app-road-rendering.test.mjs` — updated to the
  frame-keyed flags and the HUD-icon scale probe.

## Verification artifacts

```
node --test app-landscape-scene + app-ui-art + app-view-scale +
  app-popup + app-decoded-render-scene -> # pass 29, # fail 0

Real-data run (SPAU.PA, iPhone-13-like context, DPR 3, touch):
  castle: true
  flags-wave-pixels-changed: true   <- two captures 400ms apart differ
  popup: buildBasic
  artifacts/story-06-cursor-on-map.png — the 5-point cursor visible
  at the tapped tile, on the map, not in a corner.

npm run ci:release -> exit=0 (captured directly; the first run
  caught app-road-rendering still pinning the static flag key — the
  gate doing its job — updated to the frame-keyed flag, re-run green)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

The cursor artifact and wave-pixel check ride the generated-world
seed; "feels right under the thumb" remains the maintainer's call —
this story unblocks the third device pass (SB-34-05).

## Acceptance criteria — re-checked

- [x] Cursor at the selected tile, never corner chrome.
- [x] Construction cross at progress-0 sites.
- [x] Flags cycle the reference frames; real-data pixels change.
- [x] Fixture carries cross + flag frames.
