# SB-44-02 — Feedback Capture and Export

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-01
- **Unblocks:** the Bucket-A gate closures (the hand-back report is what I author the gate evidence from)
- **Owner:** unassigned

## Problem

SB-44-01's verdicts live in memory. On a real phone the maintainer
switches constantly between the game and the deck — every switch can
discard the tab and lose the run. And once the run is done, there's no
way to get the verdicts back to the PMO flow except retyping them.

## What ships

- **Persistence.** Every verdict and note writes to `localStorage` and
  reloads on open, so an app-switch or refresh never loses a run. A
  resume banner shows when a prior run is restored, with a "start over"
  reset.
- **Export.** A final results slide compiles the verdicts into a
  markdown report — per phase, each check's status + notes, and a
  per-phase "all pass / N failed" verdict — with Copy-to-clipboard and
  Download buttons. That report is what the maintainer hands back, and
  what each gate's `evidence-story-*.md` gets authored from.

The capture layer hooks the `onVerdictChange` seam SB-44-01 already left
in place, so it's additive.

## freeserf.net boundary

None — verification tooling, no product runtime, not a player-facing
path.

## Acceptance criteria

- [x] A verdict and its note survive a reload (localStorage round-trip),
  with a resume banner on restore — proven headless (verify-deck.mjs
  pass 3).
- [x] The results slide emits a correct markdown report (every check,
  per-phase roll-up verdict, notes) with Copy and Download.
- [x] Reset clears both in-memory and persisted state.

## Notes

This is the half that turns the deck from a presentation into a
feedback instrument. After it lands and the maintainer runs the
protocol, each all-pass phase closes via its own commit (gate story +
evidence + status flip + README), and any failed phase loops.
