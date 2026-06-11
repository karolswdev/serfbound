# SB-31-04 — Zero-Import Play Gate

- **Project:** serfbound
- **Phase:** 31
- **Status:** backlog
- **Depends on:** SB-31-03
- **Unblocks:** none
- **Owner:** unassigned

## Problem

The phase's promise is a stranger reaching active play on
`serfbound.com` with zero import steps, legitimately. The gate proves
the full first-visit path on the public URL, re-audits the legal
posture end to end, and updates every player-facing document that
spent thirty phases saying "bring your own data."

## Scope

- **In:** The first-visit e2e: clean profile → `serfbound.com` →
  package downloads → START → active play (world rendered, serfs
  working) with no import dialog; the offline second visit; a legal
  posture re-audit (shipped behavior vs the SB-31-01 conditions,
  provenance present in the served artifact, import path intact);
  player guide and README updates reflecting both paths with the
  SB-31-01 messaging split; the Phase 28 README claims refreshed if
  that phase already shipped.
- **Out:** New delivery features; performance work beyond recording
  first-visit download/start timings.

## Acceptance criteria

- [ ] A clean browser on the public URL reaches active play with zero
  import steps — e2e against a served fixture package in CI, and a
  recorded real-URL run with the licensed package.
- [ ] The same browser, offline, starts the game from cache on the
  second visit.
- [ ] The legal re-audit is recorded: every SB-31-01 condition met by
  the shipped artifact and pages; the import path verified
  untouched.
- [ ] Player guide and README document both paths without conflating
  their privacy properties.

## Test plan

- **Unit:** n/a — gate story.
- **Integration / e2e:** The first-visit and offline-revisit
  Playwright runs; docs checks for the updated guides.
- **Manual / device:** The real-URL first visit on desktop + phone,
  timed and captured.
- **Design handoff:** First-visit sequence screenshots under phase
  artifacts.

## Notes / open questions

- Preserves: the standing visual gate rule — the artifact is a
  stranger's first minute of play; and the import path's privacy
  promise, re-verified.
- Browser boundary: network + persistence (proof of the whole path).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (re-proving 1–3).
