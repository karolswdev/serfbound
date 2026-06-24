# SB-33-04 — The Social Experience, Defined

- **Project:** serfbound
- **Phase:** 33
- **Status:** done
- **Depends on:** SB-33-03
- **Unblocks:** SB-33-05
- **Owner:** KC (agent-assisted)

## Problem

The discovery story: what the completely new settlers experience IS for opted-in players - friends, real guild rosters, presence, social hub - written as a decision record with the maintainer's sign-off, scoping the phases after 33.

## Scope

- **In:** Per the problem statement and `../adoption/social-identity-decision.md`.
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [x] `../adoption/social-experience-definition.md` exists as the accepted
  planning boundary for friends, guild rosters, presence, and the social hub.
- [x] The record states the two unbreakables: accountless local play remains
  first-class, and collected social data is named plainly.
- [x] The record scopes the next candidate social phases after the Phase 33
  gate without implementing feature code.
- [x] The record forbids original game data, local saves, provider tokens,
  analytics/tracking ids, address books, browser fingerprints, exact presence
  history, and device keys as v2 credentials.
- [x] CI guards the definition so later edits cannot silently erase the
  unbreakables, pillars, data posture, or phase scope.

## Test plan

- Unit/docs guard: `tests/ci/social-experience-definition.test.mjs`.
- PMO/docs checks: `npm run test:unit`, `npm run test:docs`, and
  `npm run check:links`.
- Gate note: SB-33-05 still carries the sign-in journey e2e and accountless
  zero-network regression.

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11).
- New canon: `../adoption/social-experience-definition.md`.
