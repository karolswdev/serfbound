# Evidence — SB-44-22 Rigs Open on the Action

## The miss (debug trace)

A temporary log in `centerScrollOnPosition` on `?rig=phase-38-fisher`:

```
[camdbg] {"canvasW":700,"canvasH":587,"scale":1,"columns":128,"rows":128,
         "col":127,"row":8,"visibleCols":22,"visibleRows":29,
         "scroll":{"column":116,"row":121}}
```

The castle is at tile (127, 8) — the top-right corner of a 128×128 map, which
is why opening at origin `{0,0}` showed open sea. The first centering attempt
ignored the renderer's per-row `columnShift`, so the castle mapped to x≈112 on
a 700px canvas (left third) instead of ≈350 (center). Fixed by computing the
row scroll first, deriving `r`, then `columnShift = (r + (r&1))>>1`, and
offsetting the column scroll by it.

## After the fix

```
shot phase-38-fisher
shot phase-36-road-split
shot phase-39-border
```

`artifacts/cam2-phase-36-road-split.png` — the split road + flags sit across
the middle of the view. `cam2-phase-38-fisher.png` — the shore settlement is in
view and centered (the standalone rig HUD covers the right; in the deck
split-screen the in-game HUD is suppressed, so it centers cleaner still).

## Build + tests

```
$ npm run build      # tsc -b … (clean)
$ npm run test:unit
# tests 329
# pass 329
# fail 0
```
