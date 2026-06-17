# SB-44-19 — Verdict Taps That Actually Land

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-16 (the prior, insufficient touch fix)
- **Owner:** unassigned

## Problem

On the maintainer's real phone, Pass/Fail/Skip still could not be tapped —
across several "fixes". SB-44-16 added `data-prevent-swipe` to every control,
which is reveal.js's documented way to exempt an element from its swipe
handler. It passes every emulated-touch test, but it does **not** hold on the
maintainer's actual device: reveal's touch handler still swallows the tap.

## What ships

- **`touch: false` in `Reveal.initialize`.** Reveal no longer binds its touch
  handler at all, so taps reach the verdict buttons natively — there is no
  longer any reveal interception that *can* fail. (The deck never needed
  reveal's swipe: it has auto-advance + on-screen arrows.)
- **Our own swipe-to-navigate.** A small `touchstart`/`touchend` handler on the
  deck pane: a deliberate horizontal swipe (>50px, fast, started on empty
  slide area) steps the linear protocol via `Reveal.next/prev`. It explicitly
  ignores swipes that begin on a `button/a/input/textarea/label/.verdict-set/
  .rig-launch`, so a verdict tap is never reinterpreted as a swipe. Inert in
  split/offline modes (the pane scrolls natively there).

## freeserf.net boundary

Held. Deck tooling only.

## Acceptance criteria

- [x] A real touch tap records the verdict (touch-context Playwright: tap →
  `is-active`), with reveal's touch handler disabled.
- [x] A horizontal swipe over empty area still navigates (35.1 → next).
- [x] All deck behaviour intact (`verify-deck.mjs`: ALL DECK ASSERTIONS PASS).
