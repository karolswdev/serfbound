# SB-44-11 — Auto-Advance: the Deck Walks You Through

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-10 (the deck as single source + deck-driven rig)
- **Owner:** unassigned

## Problem

With the deck as the single source (SB-44-10), recording a verdict still
left you to manually step to the next check. The natural rhythm — do the
gesture, mark Pass/Fail, move on — wanted the deck to advance itself.

## What ships

Recording a verdict (Pass / Fail / Skip — not clearing one) steps the deck
to the next check after a short beat (`Reveal.next()`, 550 ms). In split
mode that slide change loads the next check's rig on the right (SB-44-10's
`slidechanged` driver) — so the whole loop becomes: do the gesture → mark
the verdict → the deck advances and the next rig boots, hands-free.

- Only fires when you're on that check's slide and a verdict is *set*;
  clearing a verdict cancels a pending step.
- A **remembered toggle** in the pre-flight ("Auto-advance to the next
  check after a verdict", default on) turns it off for anyone who prefers
  to step manually.

## freeserf.net boundary

Held. Deck tooling only — no engine, asset, or app change.

## Acceptance criteria

- [x] Recording a verdict on a check slide advances the deck to the next
  check (`verify-deck.mjs`: "auto-advances off 35.1 (now 35.2)").
- [x] Clearing a verdict cancels the pending advance; the toggle (default
  on, persisted) disables it.
- [x] All deck behaviour intact (`verify-deck.mjs`, ALL DECK ASSERTIONS PASS, 30 ok).
