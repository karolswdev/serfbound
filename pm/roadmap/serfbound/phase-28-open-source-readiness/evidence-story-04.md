# Evidence — SB-28-04 — OSS Readiness Gate

- **Shipped:** 2026-06-22
- **Commit:** this commit (PMO closeout); fresh-clone proof ran against
  committed gate-plumbing commit `8ec74381`
- **Owner:** KC (agent-assisted)

## Files touched

- `scripts/check-public-docs-links.mjs` — checks README and CONTRIBUTING
  markdown links, local media references, repo-boundary escapes, malformed
  URL encoding, Markdown heading fragments, and external URL syntax.
- `package.json` — adds `npm run check:links` and wires it into
  `npm run ci:release`.
- `docs/developer-guide.md`, `CONTRIBUTING.md`, `scripts/check-docs.mjs` —
  document and gate the link check.
- `CHANGELOG.md` — adds the current post-`v0.2.0` unreleased posture for
  Phase 31, Phase 44, Phase 43, and Phase 28 work.
- `pm/roadmap/serfbound/phase-28-open-source-readiness/artifacts/github-landing-page.png`
  — rendered GitHub repository landing page, including README media.

## Fresh-clone dry run

The dry run cloned the committed tree into a clean temp directory:

```text
fresh-clone-dir=/tmp/serfbound-sb28-04.NPLdNh
fresh-clone-head=8ec74381
fresh-clone-branch=main
serfbound-local-data: absent
```

Install:

```text
npm install
added 27 packages, and audited 32 packages in 727ms
found 0 vulnerabilities
```

Data-free test gate:

```text
npm test
# tests 343
# pass 343
37 passed (1.9m)
```

Release gate:

```text
npm run ci:release
# tests 343
# pass 343
37 passed (1.8m)
serfbound-boundaries-ok
serfbound-independence-ok: zero .NET artifacts in the tree.
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.
serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.
serfbound-public-doc-links-ok: 16 local targets and 7 external URLs in README/CONTRIBUTING.
serfbound-licensed-asset-release-ok: consent/boundary present, raw archives absent, 2 hosted package artifact(s) verified.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.
```

The clean-clone browser tests regenerated the same historical screenshot
artifacts that are dirty in the maintainer checkout; no local asset data was
present or created.

## Link/media failure proof

Negative check in the clean clone after temporarily changing the README
player-guide link to a missing file:

```text
npm run check:links
serfbound-public-doc-links FAILED:
- README.md: missing local link target: docs/missing-player-guide.md
negative-check-status=1
```

Missing README media remains covered by `npm run check:media`, already wired
into `ci:release` and re-proven green in the fresh-clone run above.

## Visual gate

Captured with:

```text
npx playwright screenshot --viewport-size=1440,1600 --full-page \
  https://github.com/karolswdev/serfbound \
  pm/roadmap/serfbound/phase-28-open-source-readiness/artifacts/github-landing-page.png
```

Artifact:

```text
pm/roadmap/serfbound/phase-28-open-source-readiness/artifacts/github-landing-page.png
PNG image data, 1440 x 4577, 1.6MB
```

Visual inspection: the capture shows the GitHub repository chrome, topics,
README tab, CI badge, README hero, gameplay screenshots, contributor link, and
lineage/license sections.

## Release posture

Actual tag posture:

```text
git tag --list --sort=-creatordate
v0.2.0

git ls-remote --tags origin
refs/tags/v0.2.0
```

`CHANGELOG.md` now records a current `Unreleased — after v0.2.0` section for
the shipped post-tag work, including licensed asset delivery, gate
verification, community maps, and open-source readiness.

## Acceptance criteria — re-checked

- [x] Fresh clone from a clean directory goes clone -> `npm install` ->
  `npm test` -> `npm run ci:release`, with no `serfbound-local-data/`.
- [x] CI fails on broken local README/CONTRIBUTING links via
  `npm run check:links`; missing README media is still guarded by
  `npm run check:media`; both are wired into `ci:release`.
- [x] CHANGELOG covers shipped phases after `v0.2.0`; the rendered GitHub
  landing-page capture lands under phase artifacts.

## Deviations from plan

- The link checker syntax-checks external URLs but does not fetch them in CI.
  This keeps routine commits independent from external uptime while still
  making repository-local README/CONTRIBUTING links and media references
  fail-fast.
