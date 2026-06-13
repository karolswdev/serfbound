# Evidence — SB-20-05 — The visible build stamp

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` — `formatBuildStamp` (pure, exported) +
  `SerfboundBuildInfo`; the toolbar build-stamp `<span>`
  (`data-testid="build-stamp"`) and the startup fetch of
  `./version.json` that fills its label and tooltip; `serfboundVersion`
  `0.1.0` → `0.2.0`.
- `packages/app/src/styles.css` — `.scene__toolbar-status` /
  `.build-stamp` styling.
- `.github/workflows/pages.yml` — `fetch-depth: 0`; the version stamp
  now writes `{version, tag, commit, builtAtIso}`, with the nearest
  `v*` tag from `git describe`.
- `tests/ci/app-build-stamp.test.mjs` (new) — the formatter gate.
- `tests/browser/static-shell.spec.ts` — asserts the stamp is visible
  and non-empty; the error-report version assertion bumped to `0.2.0`.

## Verification artifacts

```
gate (new), stash-verified failing pre-fix (export absent):
  SyntaxError: The requested module '@serfbound/app' does not provide
  an export named 'formatBuildStamp'
  app-build-stamp: # pass 0 / fail 1
post-fix:
  ok 1 - a tagged release reads as tag · short-commit
  ok 2 - a tag wins over a branch-name version
  ok 3 - a dispatch off a branch with no tag reads as dev build
  ok 4 - a real version (no tag field) still reads as the release
  ok 5 - garbage and missing input degrade to a bare dev build
  app-build-stamp: # tests 5 / pass 5

npm test            -> exit=0 (unit + build + 32 browser specs)
npm run ci:release  -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (5 passed; the first-Tab→import
  a11y contract held once the stamp was made a non-focusable span)
```

## Acceptance criteria — re-checked

- [x] `formatBuildStamp` reads tag · short-commit, prefers tag over a
  branch version, degrades to "dev build", never throws (CI-gated,
  stash-verified).
- [x] The build stamp is visible and non-empty in the shell toolbar
  (browser-gated).
- [x] Full unit + browser sweep, release, and compatibility gates green.

## Note

The stamp is a non-interactive `<span>`: a focusable link in the
toolbar stole the first Tab stop from the primary import control and
broke the accessibility smoke test. The full commit and build time live
in the element's `title` tooltip instead. The live "v0.2.0 · <sha>"
reading appears once the Pages deploy runs against this commit's
richer `version.json` shape — that redeploy is the maintainer's step.
