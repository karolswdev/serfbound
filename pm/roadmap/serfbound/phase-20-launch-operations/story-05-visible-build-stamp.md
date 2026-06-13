# SB-20-05 — The visible build stamp

- **Project:** serfbound
- **Phase:** 20 (post-launch operations addition)
- **Status:** done
- **Depends on:** SB-20-01
- **Unblocks:** —
- **Owner:** unassigned

## Problem

serfbound.com is served by the Pages pipeline on a tag (or a
workflow_dispatch), but nothing on the page tells you _which_ build you
are looking at. When a player reports a bug — or when the maintainer
wonders whether a deploy actually landed — there is no way to read the
served tag and commit from the running site. The deploy already stamps
a `version.json`, but the app never reads it, and its shape
(`{version, commit}`, with `version` often the branch name `main`) does
not carry the release tag.

## What ships

- `formatBuildStamp(raw)` in `packages/app/src/main.ts`: a pure,
  defensive formatter that turns a `version.json` object into a short
  label — `tag · short-commit` for a release, `dev build` for anything
  without a real tag/version, never throwing on garbage input.
- A visible build stamp in the scene toolbar (`data-testid=
  "build-stamp"`): an anchor that fetches `./version.json` at startup,
  shows the formatted label, and links to the served commit on GitHub.
  Offline / no version.json degrades silently to "dev build".
- A richer deploy stamp in `.github/workflows/pages.yml`: full-history
  checkout so `git describe` names the nearest `v*` tag; the stamp now
  carries `{version, tag, commit, builtAtIso}`.
- The stale `serfboundVersion` constant (used by the error report) moved
  `0.1.0` → `0.2.0` to match the shipped release.

## Acceptance criteria

- [x] `formatBuildStamp` reads a tagged `version.json` as `tag ·
  short-commit`, prefers the tag over a branch-name version, degrades a
  tagless/branch build to `dev build`, and never throws on `null`,
  non-objects, or a non-hex commit (CI-gated, stash-verified).
- [x] The build stamp is visible in the shell toolbar and reads a
  non-empty label (browser-gated).
- [x] Full unit + browser sweep, release gates, and compatibility gate
  green.

## Honest limits

- The end-to-end "the live site shows v0.2.0 · <sha>" can only be
  observed after the Pages deploy runs against this commit's
  `version.json` shape; the format and the fetch-and-display wiring are
  what CI holds here. The maintainer redeploy makes it live.
