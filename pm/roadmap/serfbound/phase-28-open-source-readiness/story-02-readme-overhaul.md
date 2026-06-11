# SB-28-02 — README Overhaul

- **Project:** serfbound
- **Phase:** 28
- **Status:** backlog
- **Depends on:** SB-28-01
- **Unblocks:** SB-28-04
- **Owner:** unassigned

## Problem

The current README is accurate but austere. A visitor should see what
Serfbound is within seconds: the complete classic game running in a
browser, with screenshots to prove it, a play-now path, and a feature
list where nothing is aspirational.

## Scope

- **In:** Hero section (one-paragraph pitch + lead screenshot), a
  feature showcase using the SB-28-01 media set where every claim maps
  to a shipped phase (world generator, economy, knights, original
  interface, sound, campaign + AI, DOS saves, PWA/touch, lockstep and
  correspondence multiplayer, localization), play-now link (Pages now;
  serfbound.com when Phase 29 lands), quickstart kept tight, the data
  boundary callout kept loud, CI badge.
- **Out:** Media capture (SB-28-01), CONTRIBUTING (SB-28-03), docs
  guides rewrites beyond link updates.

## Acceptance criteria

- [ ] README opens with the pitch and a real gameplay screenshot;
  features are shown with media, not asserted.
- [ ] Every feature claim is traceable to a phase/evidence (mapping
  listed in the evidence file).
- [ ] All README links resolve; the docs check covers the new
  structure; play and development paths both survive a cold read.

## Test plan

- **Unit:** `npm run test:docs` extended to required README topics.
- **Integration / e2e:** n/a — covered by the docs check and link
  verification recorded in evidence.
- **Manual / device:** Rendered review on GitHub (desktop + mobile
  width).
- **Design handoff:** Rendered README screenshot under phase
  artifacts.

## Notes / open questions

- Preserves: the README's existing legal/lineage section and data
  boundary language.
- Browser boundary: none — documentation.
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
