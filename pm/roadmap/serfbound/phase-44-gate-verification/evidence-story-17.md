# Evidence — SB-44-17 The Protocol Deck, Properly Designed

## Coherent verdict family (one frame, three hues)

The three plaques were unrelated materials. Fix: take one brass-framed base
and recolor only the interior enamel with a masked hue-shift (ImageMagick),
so the frame stays pixel-identical:

```
magick -size 128x60 xc:black -fill white -draw "roundrectangle 15,13 112,46 9,9" _mask-interior.png
magick _base-ruby.png -modulate 105,105,167 _full-green.png   # red(0°)->green(+120°)
magick _base-ruby.png _full-green.png _mask-interior.png -composite btn-pass.png
magick _base-ruby.png -modulate 128,120,122 ... -composite btn-skip.png   # amber
cp _base-ruby.png btn-fail.png
```

Result: `playtest/gumps/btn-pass.png` (emerald), `btn-fail.png` (ruby),
`btn-skip.png` (amber), `btn-wood.png` (neutral) — identical frame + gloss.

## Coherent seal family (PixelLab)

`playtest/gumps/seal-pass.png` (green ✓), `seal-fail.png` (red crossed
swords), `seal-skip.png` (amber ↑) — one gold-rimmed wax-disc + ribbon style.

## Composed check screen

`artifacts/hero-check.png` / `hero-check-pass.png` — check 35.1: header
kicker, a framed lumberjack portrait, the instruction as headline,
Watch/Pass-when inset panel, verdict bar pinned to the bottom (Pass active +
gold ring + green seal stamp). `hero-phase.png` — phase-39 intro with the
crossed-swords shield portrait and the Cinzel title. `hero-split.png` — holds
up in the 50vw rig split-screen.

## No regressions

```
$ node pm/roadmap/serfbound/phase-44-gate-verification/playtest/verify-deck.mjs
ok   - all 7 gate phases rendered (35,36,37,38,39,42,43)
ok   - 36 check slides rendered (expected 36)
ok   - every check has Pass/Fail/Skip buttons
ok   - verdict buttons aren't hijacked by reveal's .controls rule
...
ALL DECK ASSERTIONS PASS
```
