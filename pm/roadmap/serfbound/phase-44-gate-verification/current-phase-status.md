# Phase 44 — Gate Verification

**Last updated:** 2026-06-15 (SB-44-03 done: a scenario rigging harness +
in-game verification HUD. `?rig=<id>` boots the game into a check's exact
deterministic state — castle, splittable road, fisher on a shore, contested
border — on a purpose-built test map, and an overlay records Pass/Fail/Skip
in-game to the same store the deck reads. 13 rigs cover 33/36 checks across
all 7 gates; every local-game rig boots + reaches Running in real Chromium.
Earlier: SB-44-02 made verdicts durable and exportable; SB-44-01 stood up
the deck.)
**Status:** complete — the deck ships and is headless-verified. The
phase's *goal* (closing the Bucket-A gates 35–39, 42, 43) is now
unblocked: the maintainer runs the protocol on a device, hands back the
report, and each all-pass gate closes via its own commit; any fail loops
that phase.

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
- [x] Verdicts persist across reload/app-switch (a phone juggling the
  game and the deck must not lose state) and export to a markdown report
  the maintainer hands back to close the gates. (SB-44-02)
- [x] Each riggable check boots the game into its exact deterministic
  state via `?rig=<id>` on a purpose-built test map, with an in-game HUD
  that records the verdict to the shared store; rigs self-verify on bake
  and in real Chromium so they can't bit-rot. (SB-44-03)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-44-01 | The protocol deck | done | story-01-the-protocol-deck.md | evidence-story-01.md |
| SB-44-02 | Feedback capture and export | done | story-02-feedback-capture.md | evidence-story-02.md |
| SB-44-03 | Scenario rigging + in-game HUD | done | story-03-scenario-rigging.md | evidence-story-03.md |

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| In-memory verdicts lost when the phone switches to the game and back | ~~high~~ resolved | SB-44-02 persists to localStorage with a resume banner (verified) | Maintainer loses a run mid-protocol |
| CDN unreachable on the device | low | Progressive enhancement: offline fallback renders the full protocol as a scrollable stack, headless-verified with the CDN blocked | Deck blank with no network |
