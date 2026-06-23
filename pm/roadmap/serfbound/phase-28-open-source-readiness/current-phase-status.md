# Phase 28 — Open-Source Readiness

**Last updated:** 2026-06-22 (after SB-28-04).
**Status:** complete.

## Goal

Make the repository's public face worthy of the game behind it: an
enticing README with real gameplay screenshots captured through the
e2e pipeline, a feature showcase where every claim maps to shipped
evidence, a contributor onramp that survives a fresh clone, and an
OSS-readiness gate proven from the outside looking in.

## Scope

- **In:** A recorded decision on committing gameplay media (the
  asset/legal boundary extended to screenshots of decoded original
  art), an e2e-driven capture pipeline producing a curated README
  media set, the README overhaul (hero, features, play-now,
  quickstart), CONTRIBUTING + issue/PR templates + repo metadata, a
  fresh-clone contributor dry run as the gate.
- **Out:** Hosting and serfbound.com (Phase 29), rankings surfaces
  (Phase 30), marketing site, social media operations.

## Non-negotiable constraints

- Every feature claim in the README maps to a shipped phase or
  evidence file — no overclaims.
- Committed media is curated and small; heavy visual artifacts stay
  in the archive repository per the Phase 24 posture.
- The data boundary stays loud: Serfbound bundles no original assets;
  screenshots depict art decoded from the maintainer's own data.

## Exit criteria (evidence required)

- [x] The gameplay-media decision record exists and the e2e capture
  pipeline regenerates the curated README media set from a
  seed-pinned game. (SB-28-01)
- [x] The README sells the project: hero, screenshots, feature
  showcase with evidence-grounded claims, play-now and quickstart
  paths. (SB-28-02)
- [x] A contributor onramp exists: CONTRIBUTING, templates, repo
  metadata, hook setup documented. (SB-28-03)
- [x] A fresh-clone dry run goes clone → install → test → e2e green
  with no local data, and the GitHub landing page is captured as the
  visual gate. (SB-28-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-28-01 | Gameplay media pipeline | done | story-01-gameplay-media-pipeline.md | evidence-story-01.md |
| SB-28-02 | README overhaul | done | story-02-readme-overhaul.md | evidence-story-02.md |
| SB-28-03 | Contributor onramp | done | story-03-contributor-onramp.md | evidence-story-03.md |
| SB-28-04 | OSS readiness gate | done | story-04-oss-readiness-gate.md | evidence-story-04.md |

## Where we are

Phase 28 is closed. The repository now has a real public face
(README + committed media), a contributor onramp, GitHub issue/PR
templates, five seeded `good first issue` items, a current changelog,
README/CONTRIBUTING link and media checks wired into `ci:release`, a
fresh-clone dry run from a clean directory with no `serfbound-local-data/`,
and a captured GitHub landing page under this phase's artifacts.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Overclaiming features | medium | Every claim cites a shipped phase | A README claim with no evidence behind it |
| Media bloat in the repo | medium | Curated set with a size budget; heavy artifacts stay archived | Repo clone size jumps materially |
| Screenshot/IP objection | low | Decision record with rationale and precedent; media is decoded-from-owned-data captures | A rights-holder objection or takedown |

## Decisions made (this phase)

- SB-28-03 uses `docs/media/social-preview.png` as the prepared
  repository social-preview image. GitHub exposes description,
  homepage, and topics through `gh repo edit`; the social-preview image
  itself remains a repository settings upload because GitHub does not
  expose a supported CLI/API setter for that image.
- SB-28-04's CI link check resolves repository-local README and
  CONTRIBUTING links/media and syntax-checks external URLs. It does
  not fetch external URLs in CI, to avoid coupling every commit to
  third-party uptime.

## Decisions deferred

- Animated capture (GIF/video) remains deferred beyond this phase; the
  committed still set is the Phase 28 public-media baseline.
- Custom GitHub social-preview upload remains an owner settings action
  if the prepared `docs/media/social-preview.png` should replace the
  default GitHub-generated preview.
