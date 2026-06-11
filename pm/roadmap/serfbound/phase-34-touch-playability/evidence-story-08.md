# Evidence — SB-34-08 — The Road Builder

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/commands.ts` — `game.build-road` accepts an
  explicit `directions` path (the player's drawn road); the world
  validates it like any road (`buildRoad` → `canBuildRoad` + the
  destination-flag requirement). No directions → pathfinder, as
  before.
- `packages/app/src/main.ts` — the road-builder state machine:
  `roadBuilderPath` (positions, start flag first), begin from an own
  flag (build-slot act or road-slot arm → tap your flag), tap to
  extend (pathfound toward the tap, self-crossing rejected), tap the
  previous tile to undo, tap the end to plant a flag and lay the
  road, extend onto an own flag to complete there. While building
  the panel intercepts: starred slot 0 cancels, other slots inert.
  The block lives before the first render call (the first attempt
  sat after it — TDZ took the whole shell down; caught by the touch
  suite before any commit).
- `packages/app/src/panel-bar.ts` — road mode swaps the whole bar to
  the reference IsBuildingRoad layout: `[24, 0, 9, 11, 13]`.
- `packages/app/src/landscape-scene.ts` — `roadPreview` option: the
  in-progress path renders with the same road-segment sprites as
  built roads (edges normalized to the render directions).
- `packages/app/src/strings.ts` — roadExtendHint / roadFlagHint /
  roadNoPath (EN/DE); roadPickEnd retired with the two-tap flow.
- `tests/ci/engine-world-commands.test.mjs` — an explicit drawn path
  builds exactly as drawn (`hasPath` per segment); an invalid drawn
  path (not ending at a flag) rejects wholesale.
- `tests/ci/app-road-rendering.test.mjs` — the preview path draws
  real `path:` sprites (0 without preview, 2 with).
- `tests/ci/app-panel-bar.test.mjs` — the road-mode bar layout.
- `tests/browser/touch-playability.spec.ts` — the full flow under
  genuine touch at DPR 3: select the castle flag (the build slot
  publishes the road act, "8,…"), tap it → `building` +
  `"24,0,9,11,13"`, extend by tap, tap the end → flag planted, road
  laid, mode idle, "THE ROAD IS LAID" on canvas.
- `tests/browser/mobile-play.spec.ts`,
  `tests/browser/decoded-scene.spec.ts` — cancel now rides the
  starred slot 0; the road-mode bar layout asserted.

## Verification artifacts

```
node --test engine-world-commands + app-panel-bar -> # pass 9, fail 0
node --test app-road-rendering -> # pass 3, fail 0
touch-playability + mobile-play -> 8 passed (genuine touch, DPR 3)

Real-data run (SPAU.PA, iPhone-13-like, DPR 3, genuine touch):
  flag-selected: true
  road-mode: building
  last-effect: road-built
  final-notice: THE ROAD IS LAID
  artifacts/story-08-road-preview.png  <- the drawn path preview
  artifacts/story-08-road-laid.png     <- flag planted, road laid,
                                          the banner on canvas

npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

Chased en route: a "flags stopped waving" scare on real data turned
out to be sampling aliasing — the flag cycle's period is exactly
4 × 175ms = 700ms, and the pixel-diff probes sampled ~700ms apart.
The Pulse row showed the wave clock advancing (+32/700ms); probes at
non-period intervals differ. Recorded so the next scare reads the
Pulse first.

## Acceptance criteria — re-checked

- [x] Explicit drawn paths build as drawn; invalid ones reject.
- [x] Live preview with real segment sprites.
- [x] Reference road-builder bar; starred slot cancels.
- [x] Full touch flow green at DPR 3; real-data run end to end.
