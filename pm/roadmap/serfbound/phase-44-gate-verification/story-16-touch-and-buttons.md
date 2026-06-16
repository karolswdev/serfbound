# SB-44-16 — The Real Touch Fix, and Buttons That Don't Look Fugly

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-13/14 (the deck buttons + asset library)
- **Owner:** unassigned

## Problem

The maintainer still couldn't tap Pass/Fail/Skip on the device, across
several "fixes" — and the buttons looked bad (a flat parchment plaque).

The real cause of the dead taps: **reveal.js captures touch on the slides
for swipe-navigation.** On a real touchscreen its handler swallows the tap
before the button's click fires. A desktop/synthetic click still fires —
which is exactly why it passed every automated test (mouse and
emulated-tap) but failed on the maintainer's phone.

## What ships

- **The touch fix.** Reveal walks up the DOM from a touch's target and
  skips its swipe handling if any ancestor has `data-prevent-swipe`. The
  deck now marks every interactive control (buttons, links, inputs,
  textareas, labels) with it — on first render and after the rig manifest
  injects more — so taps reach the controls. Swipe-to-advance still works
  on the empty slide body.
- **New buttons (PixelLab).** Four beveled Settlers buttons replace the
  plaque: `btn-pass` (green stone), `btn-fail` (red stone), `btn-skip`
  (amber), `btn-wood` (oak, for the launch + report actions). Each verdict
  wears its colour always; the recorded one pops to full opacity with a
  brass ring, the others dim — clear and scannable.

## freeserf.net boundary

Held. First-party art (§8); deck tooling only.

## Acceptance criteria

- [x] Every interactive control carries `data-prevent-swipe` (DOM-verified),
  so reveal no longer eats taps; a tap records the verdict.
- [x] The verdict buttons are colored beveled Settlers buttons; the active
  one is brass-ringed (`deck-buttons.png`).
- [x] All deck behaviour intact (`verify-deck.mjs`).
