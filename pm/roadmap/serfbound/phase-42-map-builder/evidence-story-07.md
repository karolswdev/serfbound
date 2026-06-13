# Evidence — SB-42-07 — Copy and Paste a Region

- **Shipped:** 2026-06-13
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/map-editor.ts` — `MapRegionClip` type;
  `copyRegion(cornerA, cornerB)` (lifts the inclusive column/row
  rectangle's six arrays) and `pasteRegion(clip, target)` (writes the
  clip at the target corner as one undoable stroke, re-clamps the ≤32
  slope, wraps toroidally so an edge paste stays in bounds).
- `packages/app/src/editor-screen.ts` — the region click-sequence
  machine (`beginCopy`/`beginPaste`/`#handleRegionClick`) over painting,
  with status prompts and `hasClip`/`regionMode` accessors.
- `packages/app/src/main.ts` — Copy region / Paste buttons + wiring.
- `packages/app/src/styles.css` — the region-hint style.
- `tests/ci/engine-map-editor.test.mjs` — the copy/paste/undo gate.
- `tests/browser/map-editor.spec.ts` — the on-screen copy→paste flow.

## Verification artifacts

```
CI gate, stash-verified failing pre-fix (revert map-editor.ts +
editor-screen.ts; engine rebuilds, the test runs):
  not ok 10 - copyRegion lifts a rectangle and pasteRegion reproduces it
  error: 'editor.copyRegion is not a function'  → # pass 9 / fail 1
post-fix: engine-map-editor # tests 10 / pass 10
  - clip carries the source height (20) and object (tree); paste
    reproduces them at the target; the rest of the 2×2 transfers as the
    open base; paste is one stroke that undo reverts in a single step.

browser gate: the editor spec drives Copy region → two corner clicks →
Paste → destination click, asserting the status prompt at each step —
1 passed.

npm test            -> exit=0 (unit + build + 33 browser specs)
npm run ci:release  -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] `copyRegion`/`pasteRegion` capture and reproduce the six arrays as
  one undoable, slope-valid stroke (CI-gated, stash-verified).
- [x] On-screen Copy region → corners → Paste → destination, prompted
  at each step (browser-gated).
- [x] Full sweep + release + compatibility green.

## Note

Axis-aligned raw bounding box; paste overwrites (no blend). A visible
selection marquee is a polish follow-up.
