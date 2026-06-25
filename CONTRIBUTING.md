# Contributing To Serfbound

Serfbound is a browser-native remake delivered through the PMO roadmap in
`pm/roadmap/serfbound/`. Contributions are welcome when they preserve the core
rules of the project: no bundled original game data, no .NET product runtime,
and evidence for every shipped change.

## First Setup

From a fresh clone:

```bash
source ~/.nvm/nvm.sh
nvm use
npm ci
npx playwright install chromium
git config core.hooksPath .githooks
```

The hook path matters. The PMO pre-commit hook checks that commits carry the
contract evidence described below. Do not use `--no-verify`.

## Useful Commands

Start with the data-free checks:

```bash
npm test
npm run ci:release
```

Use narrower commands while iterating:

```bash
npm run test:unit
npm run test:browser
npm run check:boundaries
npm run check:independence
npm run check:design
npm run check:media
npm run check:links
npm run check:licensed-assets
npm run test:docs
```

`npm test` and `npm run ci:release` must pass without `serfbound-local-data/`
and without any original DOS or Amiga files.

## Local Asset Boundary

Serfbound does not commit, host, download, or redistribute original DOS/Amiga
game data. Do not commit `SPAU.PA`, extracted sprites, music, sounds, disk
images, original executables, or unlicensed converted original assets.

Real-data checks are opt-in and local only:

```bash
npm run build
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 \
SERFBOUND_SPAU_PA="serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" \
npm run test:local:assets
```

If you need screenshots from real local data, use the documented capture
commands in `docs/developer-guide.md`. Evidence may cite summaries and artifact
paths. It must not include raw original data.

## PMO Flow

Small typo fixes and narrow maintenance changes can be ordinary PRs, but the
commit hook still requires `.tmp/CONTRACT.md` with every checkbox set to `[x]`.

Substantial product, test, release, or roadmap work should follow the roadmap
story flow:

1. Read the relevant `story-*.md` file under `pm/roadmap/serfbound/`.
2. Make the code or docs change.
3. Run the commands that prove the change.
4. Add or update the matching `evidence-story-{n}.md`.
5. Flip the story status to `done` only when the acceptance criteria are met.
6. Update `current-phase-status.md` and `pm/roadmap/serfbound/README.md`.
7. Let the pre-commit hook run normally. Do not use `--no-verify`.

If you are not sure whether a change needs a PMO story, open an issue first and
link the files you expect to touch.

## Opening Issues

Bug reports should include:

- Browser and version.
- Device type and whether the app is installed as a PWA.
- Whether the run used no data, imported local `SPAU.PA`, a licensed package,
  or a custom map.
- The in-game `Copy error report` output when available.

Never attach original game data to an issue.

Feature requests should explain the player value, name the likely PMO phase or
evidence pointer if known, and call out any browser boundary involved:
rendering, storage, audio, input, network, packaging, or local data.

Good starter tasks are tracked with the `good first issue` label:
https://github.com/karolswdev/serfbound/labels/good%20first%20issue

## Good First Issue Walkthrough

Use this path for a tiny documentation PR:

1. Pick one issue from the `good first issue` label and read its pointers.
2. Create a narrow branch, for example
   `docs/good-first-issue-walkthrough`.
3. Make the smallest docs edit that satisfies the issue.
4. Run the focused docs gate:

   ```bash
   npm run test:docs
   ```

5. Before committing, create `.tmp/CONTRACT.md` from the template in
   `pm/roadmap/PMO-CONTRACT.md`, honestly check every applicable box, and let
   the `.githooks/pre-commit` hook run normally.
6. Open the PR and fill out `.github/pull_request_template.md`, including the
   verification command output.

For a small docs-only maintenance change, you usually do not need to flip a
roadmap story status or add `evidence-story-{n}.md`. In the PR template's
`PMO Story` section, say that the change is a docs-only maintenance issue and
does not mark a roadmap story as shipped. If the issue asks you to complete a
specific roadmap story, follow the full PMO story flow instead.

## Pull Requests

Before opening a PR:

- Keep the scope tied to one story or one small maintenance fix.
- Add or update tests for behavior changes.
- Run the most focused checks first, then the relevant gate command.
- Keep generated media and phase artifacts small and intentional.
- Confirm no original DOS/Amiga data or unlicensed converted assets are staged.
- Fill out `.github/pull_request_template.md`, including the PMO story and
  verification commands.

## Conduct

Be direct, specific, and respectful. The project is evidence-first: challenge
claims with tests, source references, or reproducible steps.
