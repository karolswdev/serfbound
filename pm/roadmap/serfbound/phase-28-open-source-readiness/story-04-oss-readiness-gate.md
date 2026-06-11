# SB-28-04 — OSS Readiness Gate

- **Project:** serfbound
- **Phase:** 28
- **Status:** backlog
- **Depends on:** SB-28-02, SB-28-03
- **Unblocks:** none
- **Owner:** unassigned

## Problem

OSS readiness is only real from the outside. The gate proves a
stranger's path: a fresh clone with no local data goes install → test
→ e2e green, the public landing page reads like a finished product,
and the release posture (tags, changelog) is current.

## Scope

- **In:** A fresh-clone dry run in a clean directory (clone → `npm
  install` → `npm test` → `npm run ci:release`, zero local data, output
  recorded), a link/media integrity check wired into CI, CHANGELOG
  brought current and the tag posture recorded, a capture of the
  GitHub landing page (README rendered with media) as the phase's
  visual gate.
- **Out:** Publishing announcements, hosting (Phase 29).

## Acceptance criteria

- [ ] The fresh-clone run is recorded start to finish and green with
  no `serfbound-local-data/`.
- [ ] CI fails on broken README/CONTRIBUTING links or missing
  referenced media.
- [ ] CHANGELOG covers shipped phases to date; the landing-page
  capture lands under phase artifacts.

## Test plan

- **Unit:** The docs/link/media checks in the CI-safe suite.
- **Integration / e2e:** The fresh-clone dry run itself.
- **Manual / device:** Landing-page review and capture.
- **Design handoff:** Landing-page capture under phase artifacts.

## Notes / open questions

- Preserves: the standing visual-gate rule — the gate artifact is the
  rendered public face, screenshots from real play included.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (and re-proves 1–3 from a
  cold start).
