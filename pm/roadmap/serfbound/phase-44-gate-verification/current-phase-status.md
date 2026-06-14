# Phase 44 — Gate Verification

**Last updated:** 2026-06-14 (SB-44-01 done: the device-gate playtest
deck exists — all seven Bucket-A gates as ordered, executable check
slides with Pass/Fail/Skip + notes, offline-resilient, headless-verified
in real Chromium at a phone viewport).
**Status:** in progress — SB-44-01 done; SB-44-02 (verdicts persist
across app-switches + export a hand-back report) is the next slice.

## Goal

Close the Bucket-A gates — the phases whose engineering is done but which
the framework holds open until the maintainer plays on a real device and
signs off (the Phase-34 standing rule). Those gates are 35 (locomotion),
36 (transport economy), 37 (living map), 38 (professions/tools/fire — the
alpha gate), 39 (knight fidelity), 42 (map builder), 43 (community maps).

A flat markdown checklist is the wrong instrument for a phone playtest:
it doesn't sequence the work or capture per-check verdicts. This phase
ships a **steppable reveal.js protocol** the maintainer executes in order
on the device, recording a verdict and notes per check, so each gate
closes on recorded evidence. When a phase comes back all-pass, its gate
story + `evidence-story-*.md` get authored from the maintainer's verdict
and the phase flips to complete; any fail loops that phase.

## Source / context

- Gate exit criteria are lifted verbatim-in-spirit from each phase's
  `current-phase-status.md` (Exit criteria / gate sections).
- The deck is roadmap tooling under
  `phase-44-gate-verification/playtest/`, not player-facing product
  code, so the design-standard rule (#8) does not apply to it.
- reveal.js loads from CDN as a progressive enhancement; the protocol
  degrades to a scrollable stack offline, so a phone with no network
  still runs it.

## Exit criteria (evidence required)

- [x] The protocol deck exists and runs: all seven Bucket-A gates as
  ordered, executable check slides (Pass/Fail/Skip + notes), an
  always-visible progress chip, offline fallback, headless-verified in
  Chromium at a phone viewport. (SB-44-01)
- [ ] Verdicts persist across reload/app-switch (a phone juggling the
  game and the deck must not lose state) and export to a markdown report
  the maintainer hands back to close the gates. (SB-44-02)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-44-01 | The protocol deck | done | story-01-the-protocol-deck.md | evidence-story-01.md |
| SB-44-02 | Feedback capture and export | backlog | — | — |

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| In-memory verdicts lost when the phone switches to the game and back | high | SB-44-02 persists to localStorage and adds a resume banner | Maintainer loses a run mid-protocol |
| CDN unreachable on the device | low | Progressive enhancement: offline fallback renders the full protocol as a scrollable stack, headless-verified with the CDN blocked | Deck blank with no network |
