# SB-28-03 — Contributor Onramp

- **Project:** serfbound
- **Phase:** 28
- **Status:** backlog
- **Depends on:** SB-28-01
- **Unblocks:** SB-28-04
- **Owner:** unassigned

## Problem

A motivated stranger should be able to land, understand the rules of
this codebase (PMO flow, contract hook, evidence culture, the asset
boundary), and open a useful PR without asking. None of that is
written for outsiders today — it lives in maintainer-facing docs.

## Scope

- **In:** `CONTRIBUTING.md` (setup, `git config core.hooksPath
  .githooks`, test commands, CI-safe vs opt-in real-data tests, the
  PMO story/evidence flow for substantial work, the asset boundary
  for contributions), issue templates (bug with browser/import
  context, feature) and a PR template referencing the contract, repo
  metadata (description, topics, social preview from the SB-28-01
  set), a seeded set of good-first-issue items.
- **Out:** Governance/CoC beyond a short conduct note (defer until
  there is a community), Discord/forum setup, hosting docs (Phase 29).

## Acceptance criteria

- [ ] CONTRIBUTING covers setup through first PR including the hook
  and the test matrix; a newcomer path is verifiable by reading alone.
- [ ] Issue/PR templates render on GitHub and the repo metadata
  (description, topics, social preview) is set.
- [ ] At least five good-first-issues exist with concrete pointers.

## Test plan

- **Unit:** `npm run test:docs` extended to CONTRIBUTING topics.
- **Integration / e2e:** n/a — docs and repo metadata.
- **Manual / device:** Template rendering verified on GitHub;
  screenshots in evidence.
- **Design handoff:** Social preview image under `docs/media/`.

## Notes / open questions

- Preserves: the PMO contract as the contribution mechanism — outside
  PRs meet the same evidence bar.
- Browser boundary: none — documentation and repo settings.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
- Open: whether drive-by small fixes need the full story flow —
  default: no, contract hook only; document the threshold.
