# Phase 44 — Gate Verification

**Last updated:** 2026-06-16 (SB-44-21 done: THE rig-open input block — in
split mode reveal's flattened-static slides let its `.backgrounds` layer stack
on top and swallow every verdict click the instant "Open rig here" was tapped;
fixed with pointer-events:none on reveal's background layers. This was the real
cause of the dead taps in the rig flow. SB-44-20 done: correctable verdicts on
a resumed
run — auto-advance now fires only on a fresh decision (so re-deciding a
pre-filled check no longer jumps away), plus an always-visible ↺ Reset.
SB-44-19 done: verdict taps that actually land —
reveal's touch handler swallowed Pass/Fail/Skip on a real device despite
data-prevent-swipe, so it's now disabled (touch:false) with our own swipe-nav
that ignores controls. SB-44-18 done: a god-mode building editor —
under ?rig/?dev, highlight every building and move / replace / delete it, or
place new ones from a palette, right on the live map. SB-44-17 done: the
protocol deck redesigned — one coherent verdict-plaque family, a matching
wax-seal family, a single type scale + Cinzel headings, and each check composed
as a full-bleed screen with a character portrait and a bottom-pinned verdict
bar. Earlier: SB-44-03 done: a scenario rigging harness +
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
| SB-44-04 | The in-game results report | done | story-04-in-game-report.md | evidence-story-04.md |
| SB-44-05 | Host the protocol deck | done | story-05-host-the-deck.md | evidence-story-05.md |
| SB-44-06 | The report server | done | story-06-report-server.md | evidence-story-06.md |
| SB-44-07 | Split-screen protocol + lumberjack trees | done | story-07-split-screen-and-trees.md | evidence-story-07.md |
| SB-44-08 | Vertical split + forged results window | done | story-08-forged-results-window.md | evidence-story-08.md |
| SB-44-09 | The protocol deck, in style | done | story-09-deck-in-style.md | evidence-story-09.md |
| SB-44-10 | One source of truth: deck guides, game is the rig | done | story-10-one-source-of-truth.md | evidence-story-10.md |
| SB-44-11 | Auto-advance: the deck walks you through | done | story-11-auto-advance.md | evidence-story-11.md |
| SB-44-12 | Playtest fixes: verdicts, a road that staffs, a debug rig view | done | story-12-playtest-fixes.md | evidence-story-12.md |
| SB-44-13 | Tappable verdicts: finger-sized buttons + no stale deck | done | story-13-tappable-verdicts.md | evidence-story-13.md |
| SB-44-14 | A PixelLab asset library + designed protocol | done | story-14-asset-library.md | evidence-story-14.md |
| SB-44-15 | Fast-forward in the rig debugger | done | story-15-rig-fast-forward.md | evidence-story-15.md |
| SB-44-16 | The real touch fix + new buttons | done | story-16-touch-and-buttons.md | evidence-story-16.md |
| SB-44-17 | The protocol deck, properly designed | done | story-17-deck-overhaul.md | evidence-story-17.md |
| SB-44-18 | God-mode building editor | done | story-18-building-editor.md | evidence-story-18.md |
| SB-44-19 | Verdict taps that actually land (touch:false) | done | story-19-verdict-taps.md | evidence-story-19.md |
| SB-44-20 | Correctable verdicts on a resumed run + reset | done | story-20-correctable-verdicts.md | evidence-story-20.md |
| SB-44-21 | The rig-open input block (reveal backgrounds eat clicks) | done | story-21-rig-open-input-block.md | evidence-story-21.md |

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| In-memory verdicts lost when the phone switches to the game and back | ~~high~~ resolved | SB-44-02 persists to localStorage with a resume banner (verified) | Maintainer loses a run mid-protocol |
| CDN unreachable on the device | low | Progressive enhancement: offline fallback renders the full protocol as a scrollable stack, headless-verified with the CDN blocked | Deck blank with no network |
