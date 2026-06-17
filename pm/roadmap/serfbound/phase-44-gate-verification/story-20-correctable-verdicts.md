# SB-44-20 — Correctable Verdicts on a Resumed Run + Always-On Reset

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-11 (auto-advance), SB-44-19 (taps land)
- **Owner:** unassigned

## Problem

The maintainer resumed an in-progress run and "couldn't change any of the
dispositions." Cause: auto-advance fired on *every* recorded verdict, including
when re-deciding an already-recorded one. On a resumed run every check is
pre-filled, so each tap changed the verdict and then immediately jumped to the
next (also-filled) check — it felt like nothing could be changed and the deck
kept "recalling" the old run. There was also no easy way to clear a stale run
from mid-deck (reset lived only on the title/results slides).

## What ships

- **Auto-advance only on a fresh decision.** `setVerdict` now advances only
  when an *unset* check gets its first verdict. Changing or clearing an
  already-recorded verdict stays on the slide, so you can correct a disposition
  on a resumed run without the deck jumping away.
- **An always-visible Reset.** A fixed `↺ Reset` control (top-left; right in
  split) clears the run and storage from anywhere, one tap to a clean slate.
- **`touch-action: manipulation`** on the verdict/gump buttons — removes the
  mobile tap delay and double-tap-zoom, so taps land snappier.

## freeserf.net boundary

Held. Deck tooling only.

## Acceptance criteria

- [x] Changing a verdict on a resumed run stays on the same check (touch test:
  pass→fail stays on 35.1, fail active).
- [x] A fresh verdict still auto-advances (`verify-deck.mjs` auto-advance test).
- [x] The reset control clears the run from mid-deck (touch test: 0/36).
- [x] All deck behaviour intact (`verify-deck.mjs`: ALL DECK ASSERTIONS PASS).
