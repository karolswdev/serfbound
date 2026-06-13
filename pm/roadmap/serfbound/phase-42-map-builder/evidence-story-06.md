# Evidence — SB-42-06 — Flatten and Brush Size

- **Shipped:** 2026-06-13
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/editor-screen.ts` — a `flatten` tool kind + palette
  entry (sets the brush area's height to a level base via
  `MapEditor.setHeight`); `applyEditorTool` takes a `radiusOverride`
  honoured by terrain/height/flatten; `MapEditorScreen` tracks the
  active brush radius (1/2/3), renders the size control, and passes it
  to `applyAt`.
- `packages/app/src/styles.css` — `.editor-size` control styling
  (reuses the chip recipe + existing tokens).
- `tests/ci/app-editor-screen.test.mjs` — flatten + radius-override gates.
- `tests/browser/map-editor.spec.ts` — flatten + brush-3 on screen.

## Verification artifacts

```
CI gate, stash-verified failing pre-fix (revert editor-screen.ts, keep
the new cases, rebuild — flatten tool + radius override absent):
  not ok 4 - flatten levels the brush area to the base, holding the slope clamp
  not ok 5 - the radius override widens the brush; default uses the tool radius
  # pass 4 / fail 2
post-fix: app-editor-screen # tests 6 / pass 6
  - flatten levels the radius-2 neighborhood to base 0, ≤32 slope holds
  - radius 0 paints one tile; radius 2 paints the full 19-tile neighborhood

browser gate: the editor spec now also selects brush size 3 and the
flatten tool (aria-pressed true) and clicks to repaint — 1 passed.

npm test            -> exit=0 (unit + build + 33 browser specs)
npm run ci:release  -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] `applyEditorTool` flattens to the base and honours a radius
  override; the slope invariant holds (CI-gated, stash-verified).
- [x] Flatten + the 1/2/3 size control on the editor surface; a bigger
  brush paints wider (browser-gated).
- [x] Full sweep + release + compatibility green.

## Note

Flatten levels to a fixed base (0). "Level to the clicked tile" and
copy/paste a rectangle (SB-42-07) are the next tools.
