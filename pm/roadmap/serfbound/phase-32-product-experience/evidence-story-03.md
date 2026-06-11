# Evidence — SB-32-03 — First-Run and Import as a Designed Journey

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` — the welcome composition beneath the
  map preview (pitch in the product voice, the drop zone, the privacy
  promise with a meadow accent, the demo hint), one shared import
  path for picker and drag-drop (`applyImportFile`), drop-zone
  dragover/busy states, the welcome error mirror, keyboard activation
  for the zone.
- `packages/app/src/styles.css` — the welcome components (`.welcome`,
  card, drop zone with hover/dragover/busy, error/promise/hint), the
  unsupported-file treatment (banner-red on the drop zone and the
  data group), pre-import scene scrolling.
- `tests/browser/first-run.spec.ts` — three new tests: the greeting
  and drag-drop path, the designed recoverable error, the
  returning-settler reload (no re-greeting).
- `scripts/check-design-tokens.mjs` — reserved list now empty.

## Verification artifacts

```
serfbound-design-tokens-ok: 43 tokens defined, 43 consumed,
  0 reserved, raw-color ratchet 0/0.
first-run.spec: 3 passed
static-shell + first-run + chrome-states: 10 passed
npm run ci:release -> exit 0 (exit code captured directly this time)
```

Design honesty note: the first welcome was a centered overlay over
the canvas — and `static-shell.spec` caught it stealing the
pre-import preview's pointer events (an existing behavior contract:
the map stays hoverable/clickable before import). **The app yielded,
not the test**: the welcome moved in-flow beneath the preview. The
pipe-masked exit code that briefly hid this failure is recorded in
the lessons (`tail` after a pipeline eats failures; exit codes are
now captured directly).

Real-data captures (local `SPAU.PA`) under `artifacts/`:
`story-03-welcome-{desktop,mobile}.png`,
`story-03-wrong-file-desktop.png`,
`story-03-imported-{desktop,mobile}.png`.

## Acceptance criteria — re-checked

- [x] The first-visit screen answers what/why/how in the product's
  voice — pitch, the SPAU.PA ask, the privacy promise ("Your data
  never leaves this device. No uploads, no required accounts,
  nothing to track."), the demo hint; asserted in first-run.spec.
- [x] Import succeeds via drag-drop and picker through one path with
  designed dragover/busy/success states; the wrong-file moment is
  designed (banner-red on the zone and data group, the error speaking
  where the player looks) and recovery is the same gesture —
  first-run.spec test 2.
- [x] The returning player lands on the title composition with no
  re-greeting — first-run.spec test 3; captures committed;
  ci:release green.

## Deviations from plan

- The Phase 8 error strings ("File not usable", "… cannot be used.
  Choose SPAU.PA to start.") are test-locked and already plain-voiced;
  kept verbatim, with the design treatment carrying the improvement.
- The welcome is in-flow below the preview rather than an overlay —
  forced by the pre-import pointer contract and better for it (the
  map greets above the words).

## Follow-ups

- SB-32-04: the competitive surfaces (`--sb-shadow-card` already in
  use by the welcome card; lobby cards reuse it).
- SB-32-05: the journey captures here become the "after" half of the
  gate's before/after set.
