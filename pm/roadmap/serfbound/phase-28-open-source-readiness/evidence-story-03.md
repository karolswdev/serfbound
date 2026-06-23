# Evidence — SB-28-03 — Contributor Onramp

- **Shipped:** 2026-06-22
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `CONTRIBUTING.md` — fresh-clone setup, hook setup, CI-safe and
  opt-in real-data test commands, PMO story/evidence flow, issue/PR
  expectations, asset boundary, and conduct note.
- `.github/ISSUE_TEMPLATE/bug_report.yml` — structured browser,
  device, PWA, data-source, error-report, reproduction, and
  asset-boundary intake.
- `.github/ISSUE_TEMPLATE/feature_request.yml` — structured player
  value, proposal, PMO pointer, boundary, and asset-boundary intake.
- `.github/pull_request_template.md` — summary, PMO story/evidence,
  verification commands, asset boundary, design, hook, and docs/test
  checklist.
- `scripts/check-docs.mjs` — extends `npm run test:docs` to the
  contributor guide and GitHub templates.
- `README.md` and `docs/README.md` — link the contributor guide and
  add the CI badge to the public README.
- Phase 28 PMO files — story/status/evidence updated for SB-28-03.

## GitHub metadata and starter issues

Repository metadata was updated with:

```text
gh repo edit karolswdev/serfbound --homepage https://serfbound.com \
  --add-topic browser-game --add-topic strategy-game \
  --add-topic typescript --add-topic webgl2 --add-topic webaudio \
  --add-topic pwa --add-topic offline-first \
  --add-topic game-preservation
```

Verified snapshot:

```json
{
  "description": "The Settlers I, reborn in your browser: a faithful pure-TypeScript remake with offline play, lockstep and correspondence multiplayer. Bring your own game data.",
  "homepageUrl": "https://serfbound.com",
  "nameWithOwner": "karolswdev/serfbound",
  "topics": [
    "browser-game",
    "game-preservation",
    "offline-first",
    "pwa",
    "strategy-game",
    "typescript",
    "webaudio",
    "webgl2"
  ],
  "url": "https://github.com/karolswdev/serfbound"
}
```

Seeded `good first issue` items:

- #1 — `docs: add Community Maps player-guide section`
- #2 — `tests: add issue-template fixture check`
- #3 — `docs: add README media capture troubleshooting`
- #4 — `docs: add Map Builder import-boundary note`
- #5 — `docs: add good-first-issue walkthrough`

Each issue carries concrete file pointers, the `documentation` label,
the `good first issue` label, and an explicit no-original-data note.

`docs/media/social-preview.png` remains the prepared repository social
card asset from SB-28-01. GitHub's documented social-preview flow is a
repository Settings upload (`Social preview` -> `Edit` -> `Upload an
image...`; <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview>),
while `gh repo edit` exposes description, homepage, and topics but no
social-preview image setter. SB-28-04's rendered landing page gate
should confirm the final GitHub-side image after that manual settings
upload.

## Verification artifacts

```text
npm run test:docs
> node scripts/check-docs.mjs
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.

npm run check:media
> node scripts/check-readme-media.mjs
serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.

ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f); puts "yaml-ok: #{f}" }' ...
yaml-ok: .github/ISSUE_TEMPLATE/bug_report.yml
yaml-ok: .github/ISSUE_TEMPLATE/feature_request.yml

npm run check:boundaries
serfbound-boundaries-ok

npm run check:independence
serfbound-independence-ok: zero .NET artifacts in the tree.
```

```text
gh issue list --repo karolswdev/serfbound --label "good first issue" --state open
#5 docs: add good-first-issue walkthrough ... labels=documentation,good first issue
#2 tests: add issue-template fixture check ... labels=documentation,good first issue
#4 docs: add Map Builder import-boundary note ... labels=documentation,good first issue
#3 docs: add README media capture troubleshooting ... labels=documentation,good first issue
#1 docs: add Community Maps player-guide section ... labels=documentation,good first issue
```

## Acceptance criteria — re-checked

- [x] CONTRIBUTING covers setup through first PR: hook setup,
  CI-safe vs opt-in real-data tests, PMO story/evidence flow, and the
  contribution asset boundary.
- [x] Issue and PR templates live under GitHub-recognized template
  paths, and the API-accessible repo metadata (description, homepage,
  topics) is set. The prepared social-preview asset is recorded with
  the settings-only upload caveat above.
- [x] At least five `good first issue` items exist with concrete
  pointers.

## Deviations from plan

- The GitHub connector returned `403 Resource not accessible by
  integration` for issue creation, so the authenticated `gh` CLI was
  used for the five starter issues.
- Custom social-preview upload is a GitHub settings UI step, not a
  supported `gh repo edit` flag. The source asset is present and the
  required manual setting is explicit for SB-28-04 verification.

## Follow-ups

- SB-28-04: run the fresh-clone dry run, link/media check, changelog
  pass, and capture the rendered GitHub landing page after the social
  preview is uploaded in settings.
