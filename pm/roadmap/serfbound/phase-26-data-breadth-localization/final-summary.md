# Phase 26 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Half by delivery, half by honest decision — exactly as the phase was
designed. **Amiga data support is NO-GO**: no lawful corpus exists
locally, and the phase's own non-negotiable (corpus parity tests, the
DOS standard, no exceptions) forbids corpus-blind decoders; the
decision record carries the full reference-loader inventory and the
re-opening condition (SB-26-02 closed not-applicable under its own
"if go" gate). **Localization is delivered**: every in-game string
lives in keyed language tables — English renders identically to before
(the unchanged e2e suite is the proof), the complete German table rides
the original font's umlauts, glyph coverage is a test failure rather
than a runtime blank, and the language switch (?lang / the shell
toggle) persists and drives the whole surface, proven end-to-end in
German and captured from real data ("SPIELER 2 ENTER - 60").

## Exit criteria — final state

- [x] Amiga evaluation with a clear go/no-go (SB-26-01: NO-GO,
  blocking fact named).
- [x] If go: Amiga decoders (SB-26-02: condition false; closed
  not-applicable, reopening on corpus arrival).
- [x] Language tables with English reference + German proving pair
  (SB-26-03).
- [x] The localized-UI gate: switch persisted, German sweep, layout
  audit, captures, gates green (SB-26-04).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-26-01 | Amiga corpus evaluation | evidence-story-01.md |
| SB-26-02 | Amiga decoders (closed n/a) | evidence-story-02.md |
| SB-26-03 | String extraction and language tables | evidence-story-03.md |
| SB-26-04 | Localized UI gate | evidence-story-04.md |

## Decisions and honest records

- **Extended scripts**: the original font carries A–Z, digits,
  umlauts, and five symbols. Languages needing more (Cyrillic, CJK, …)
  cannot render from the player's data; supporting them means a custom
  bitmap font — deferred until a community translation demands it. The
  glyph-coverage test is the tripwire that makes this impossible to
  ship by accident.
- DOM shell texts stay English (no glyph constraint; recorded
  follow-up if wanted); mission names are campaign data, not UI.
- Suite growth this phase: 222 → 225 unit tests, 13 → 14 browser
  suites.

## What's next

Phase 27 — realtime online play (WebRTC), the roadmap's last
scaffolded phase; the Phase 25 online-surface follow-up remains open
pending service deployment.
