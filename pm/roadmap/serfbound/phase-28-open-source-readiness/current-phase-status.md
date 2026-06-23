# Phase 28 — Open-Source Readiness

**Last updated:** 2026-06-22 (after SB-28-03).
**Status:** in progress.

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
- [ ] A fresh-clone dry run goes clone → install → test → e2e green
  with no local data, and the GitHub landing page is captured as the
  visual gate. (SB-28-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-28-01 | Gameplay media pipeline | done | story-01-gameplay-media-pipeline.md | evidence-story-01.md |
| SB-28-02 | README overhaul | done | story-02-readme-overhaul.md | evidence-story-02.md |
| SB-28-03 | Contributor onramp | done | story-03-contributor-onramp.md | evidence-story-03.md |
| SB-28-04 | OSS readiness gate | backlog | story-04-oss-readiness-gate.md | — |

## Where we are

SB-28-03 now adds the outsider onramp: root `CONTRIBUTING.md`, GitHub
issue forms, the PR template, docs-gate coverage for those files, the
repo metadata topics, and five seeded `good first issue` items. The
phase's remaining work is SB-28-04: the fresh-clone dry run, link/media
integrity gate, changelog pass, and rendered GitHub landing-page
capture. Ordering note (2026-06-11): Phase 32 (product experience)
should land before this phase's shell-visible media — in-game
screenshots are unaffected, but landing/shell captures and the social
preview should show the redesigned chrome, and SB-28-02's play-now path
now points at `https://serfbound.com`.

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

## Decisions deferred

- Animated capture (GIF/video) in the README — decide in SB-28-01
  against the size budget; default is stills only.
- Social preview image — default: derived from the curated media set
  in SB-28-03.
