# SB-31-04 — Zero-Import Play Gate

- **Project:** serfbound
- **Phase:** 31
- **Status:** in progress
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
- [x] The same browser, offline, starts the game from cache on the
  second visit.
- [ ] The legal re-audit is recorded: every SB-31-01 condition met by
  the shipped artifact and pages; the import path verified
  untouched.
- [x] Player guide and README document both paths without conflating
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

## Progress

2026-06-22: the CI fixture gate now proves the default public-style
path: `/licensed-assets/manifest.json` points at an
`sb31-runtime-v1` package, a clean browser reaches `Running` from `/`
without importing a file, and the same browser reloads offline and
starts again from the IndexedDB package cache without a second package
download.

The fixture is isolated from the shared browser test server, and the
startup cache probe no longer creates `serfbound-licensed-assets` on
ordinary no-manifest visits. Full browser verification is green at 36
tests.

The repository now carries the first converted public package:
`public/licensed-assets/serfbound-demo-dos-en.sb31.json`, referenced by
`public/licensed-assets/manifest.json`. Local release-preview audit
passes with package checksum `fnv1a32:3ddba0a7` and source checksum
`fnv1a32:08dbd8c7`; the package inspection reports 34 resources,
2,233 sprites, 39 SFX, and 4 music tracks.

The repository also has a repeatable public-origin audit:
`npm run audit:licensed-assets:public -- --base https://serfbound.com`.
The current live public run fails exactly where expected before
deployment: `https://serfbound.com/licensed-assets/manifest.json`
returns HTTP 404.

Remaining before `done`: record the real `serfbound.com` run with the
licensed package, including desktop/phone captures and the shipped
artifact/legal re-audit. The final `evidence-story-04.md` ships when
this story flips to done.
