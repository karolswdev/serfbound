# SB-34-03 — DPR-3 Coordinate Spaces: Cursor, Panel, Popups

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-01
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Punch items 5 and 6: on the phone the build menu showed every
building "cropped after the first like 5 pixels," and road building
was unreachable. The popup/panel geometry had to be proven hit-true
and fully visible at DPR 3 — and the chrome had to publish its hit
rectangles so the gates verify against the same truth the code uses.

## What it turned out to be

Not a DPR bug. The UI render layer sorted its sprites by `sortY`
like the map layers — so a popup's lower background tile rows drew
*after* (on top of) the building sprites pushed before them, leaving
only the top sliver of each building visible. Broken at every scale
on every device; no gate had ever looked at the build menu's pixels.
Fix: the UI layer keeps push order (paint order); stable sort.

## Acceptance criteria

- [x] The build popup renders its content fully (paint-order unit
  gate in tests/ci/app-popup.test.mjs — fails on the old renderer,
  verified) and fits inside the canvas at DPR 3.
- [x] The chrome publishes `data-serfbound-panel-rect` and
  `data-serfbound-popup-rect` (canvas CSS space); taps derived from
  them hit: road mode engages (punch 5), the flip button cycles the
  build pages (punch 6) — genuine touch, DPR 3.
- [x] Real-data before/after captures recorded (artifacts/).
