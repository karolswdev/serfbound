# Phase 26 — Data Breadth and Localization

**Last updated:** 2026-06-10.
**Status:** in progress — SB-26-01..03 done.

## Goal

Widen who can play with their own data, in their own language: evaluate
Amiga data support against a real corpus to the same parity standard the
DOS path met, land Amiga decoders behind the existing typed catalog if
the evidence supports it, extract UI strings into language tables, and
ship a localized interface within the original glyph set's limits.

## Scope

- **In:** Amiga corpus evaluation and go/no-go decision record, Amiga
  format decoders as parallel implementations behind the typed asset
  catalog (gated on the decision), UI string extraction from the chrome
  modules into per-language tables, a localized-UI gate including the
  glyph-coverage audit (A–Z plus umlauts) and a recorded decision for
  scripts the original fonts cannot carry.
- **Out:** Bundling any game data (the boundary is eternal), community
  translation tooling/platforms, new fonts unless the recorded decision
  calls for them.

## Non-negotiable constraints

- The asset boundary holds for Amiga exactly as for DOS: user-provided,
  never committed/hosted/bundled/cached; real-data tests stay opt-in.
- Amiga support ships only with corpus parity tests — the DOS standard,
  no exceptions.
- Localization never invents UI: translated strings flow through the
  same decoded-font render path.

## Exit criteria (evidence required)

- [x] The Amiga evaluation runs against a real corpus and the go/no-go
  decision is recorded with evidence. (SB-26-01: NO-GO — no lawful
  corpus exists locally; the record carries the full loader inventory
  and the re-opening condition.)
- [x] If go: Amiga archives import, decode, and play behind the same
  typed catalog with opt-in parity tests. (SB-26-02: the "if go"
  condition is false — closed not-applicable, reopening on corpus
  arrival.)
- [x] UI strings live in language tables with English extracted as the
  reference language and a second language proving the path. (SB-26-03)
- [ ] The localized-UI gate passes: language switch in the shell, glyph
  coverage audited, real-data captures recorded. (SB-26-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-26-01 | Amiga corpus evaluation | done | story-01-amiga-corpus-evaluation.md | evidence-story-01.md |
| SB-26-02 | Amiga decoders behind the typed catalog | done (n/a) | story-02-amiga-decoders.md | evidence-story-02.md |
| SB-26-03 | String extraction and language tables | done | story-03-string-extraction-language-tables.md | evidence-story-03.md |
| SB-26-04 | Localized UI gate | backlog | story-04-localized-ui-gate.md | — |

## Where we are

SB-26-01..03 shipped: the Amiga no-go is on record (02 closed
not-applicable, reopening on corpus arrival), and the whole in-game
text surface now lives in keyed language tables — English identical to
before (the e2e suite is the proof), German complete inside the
original glyph set, coverage enforced by test. Next: SB-26-04 the
language switch and the phase gate.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| No legitimate Amiga corpus available | medium | Evaluation story gates the track; no-go is a valid outcome | Corpus cannot be sourced lawfully |
| Amiga formats diverge more than the decode layer expects | medium | Parallel decoders behind the catalog interface | Catalog interface changes leak into the engine |
| Glyph set cannot carry a target language | high | Coverage audit first; recorded font decision for gaps | Shipping text the font cannot render |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Target language list beyond the proving pair (English + German fits
  the umlaut glyph set).
- Extended-script font strategy.
