# Evidence — SB-44-16 The Real Touch Fix, and New Buttons

## The touch fix (the actual cause of dead taps)

reveal.css/js: `.reveal .slides{pointer-events:none}` + a touch handler that
swallows taps for swipe-nav. `data-prevent-swipe` on an ancestor makes reveal
skip it. Verified in a touch context:

```
ok - verdict buttons carry data-prevent-swipe (touch fix)
ok - tap records the verdict
```

This is why every prior test passed (mouse/synthetic clicks fire regardless)
but the maintainer's real phone taps did not.

## New buttons (PixelLab)

`playtest/gumps/btn-pass.png` (green stone), `btn-fail.png` (red), `btn-skip.png`
(amber), `btn-wood.png` (oak) — beveled Settlers buttons replacing the plaque.
`artifacts/deck-buttons.png` — check 35.1 with the colored verdict buttons
(Pass active + brass-ringed, Fail/Skip dimmed), the serf gate icon, and the
green Pass seal stamped.

## No regressions

`verify-deck.mjs` — ALL DECK ASSERTIONS PASS.
