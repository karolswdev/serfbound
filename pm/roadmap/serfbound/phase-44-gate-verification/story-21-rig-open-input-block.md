# SB-44-21 — The Rig-Open Input Block (reveal backgrounds eat clicks)

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-07/08 (split-screen), SB-44-19/20 (the prior tap work)
- **Owner:** unassigned

## Problem

The maintainer narrowed it precisely: input is blocked **the moment "▶ Open rig
here" is tapped** — and it reproduced in a fresh Firefox, so it was never touch
or cache. Verified on the live site by hit-testing: after the split opens, the
element on top of every verdict button is reveal.js's `div.slide-background-
content` (its `.backgrounds` layer) — it was swallowing every click.

Cause: split mode flattens the slides to **static** positioning so they lay out
in the narrow pane. That removes the slides from the stacking context that kept
reveal's absolutely-positioned `.backgrounds` div *behind* them, so the
background layer paints on top and intercepts pointer events. This — not touch
handling — is what blocked verdict taps in the rig-open flow all along.

## What ships

One rule: reveal's background layers never capture pointer events on the deck.

```css
.reveal .backgrounds, .reveal .slide-background, .reveal .slide-background-content {
  pointer-events: none !important;
}
```

The deck has no interactive slide backgrounds, so this is harmless in normal
mode and removes the overlay block in split mode.

## freeserf.net boundary

Held. Deck tooling only.

## Acceptance criteria

- [x] After "Open rig here" (split active), the verdict button is the top
  element at its own center (hit-test) and a click records the verdict
  (reproduced the failure on live, verified the fix locally).
- [x] All deck behaviour intact (`verify-deck.mjs`: ALL DECK ASSERTIONS PASS).
