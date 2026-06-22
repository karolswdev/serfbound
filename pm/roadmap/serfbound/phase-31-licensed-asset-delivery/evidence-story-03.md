# Evidence — SB-31-03 — Hosted Delivery and Local Caching

- **Shipped:** 2026-06-22
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/licensed-asset-delivery.ts` — dedicated IndexedDB
  store, delivery config, download/verify/cache/restore state machine,
  checksum mismatch rejection, stale cache invalidation, and clear
  helper for licensed packages.
- `packages/app/src/render-layer-scene.ts` — package-to-render-assets
  bridge for `sb31-runtime-v1`, reconstructing decoded sprites, serf
  torsos, SFX, and music from verified package payloads.
- `packages/app/src/main.ts` — hosted package activation, visible
  `Licensed package` vs `Imported data` source indicator, package URL
  + checksum config path, imported-data override, and clear behavior for
  the active source.
- `packages/engine/src/local-game.ts` and
  `packages/app/src/local-game-save-store.ts` — local game/save
  metadata now distinguishes `licensed-asset-package` from
  `imported-dos-pa-catalog` without changing imported-data seed
  derivation.
- `scripts/check-licensed-asset-release.mjs` and `package.json` —
  release-gate check for consent/boundary presence, absence of raw
  archives, and verification of any deliberate
  `licensed-assets/*.sb31.json` artifacts.
- `tests/ci/app-licensed-asset-delivery.test.mjs` — unit coverage for
  download-once restore, release checksum mismatch rejection, stale
  cache invalidation, and package render/start capability.
- `tests/browser/licensed-asset-delivery.spec.ts` — Playwright fixture
  proof for first download, reload without re-download, recoverable
  checksum mismatch, and local import coexistence.
- `README.md`, `docs/player-guide.md`, `docs/developer-guide.md`, and
  roadmap files — source messaging and PMO status updated.

## Verification artifacts

```text
> serfbound-workspace@0.2.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app
```

Focused unit coverage:

```text
TAP version 13
# Subtest: licensed asset delivery downloads once and restores from cache without refetching
ok 1 - licensed asset delivery downloads once and restores from cache without refetching
# Subtest: licensed asset delivery rejects release checksum mismatches
ok 2 - licensed asset delivery rejects release checksum mismatches
# Subtest: corrupt cached licensed packages are cleared before a fresh verified download
ok 3 - corrupt cached licensed packages are cleared before a fresh verified download
# Subtest: licensed package render assets match archive-decoded start capability
ok 4 - licensed package render assets match archive-decoded start capability
1..4
# tests 4
# pass 4
# fail 0
```

Focused browser coverage:

```text
Running 2 tests using 1 worker

✓ hosted licensed package downloads once, restores offline from IndexedDB, and coexists with import
✓ checksum-mismatched hosted package is recoverable and never activates

2 passed
```

Release-gate check:

```text
> serfbound-workspace@0.2.0 check:licensed-assets
> node scripts/check-licensed-asset-release.mjs

serfbound-licensed-asset-release-ok: consent/boundary present, raw archives absent, 0 hosted package artifact(s) verified.
```

Full unit gate:

```text
> serfbound-workspace@0.2.0 test:unit
> npm run build && node --test tests/ci/*.test.mjs

1..336
# tests 336
# pass 336
# fail 0
```

Full browser gate:

```text
> serfbound-workspace@0.2.0 test:browser
> npm run build:web && playwright test

35 passed (2.0m)
```

Static release gate:

```text
> serfbound-workspace@0.2.0 test:release:static
> npm run release:static && node scripts/test-static-hosting.mjs

serfbound-release-artifact-ok: inspected 57 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
```

Documentation and boundary checks:

```text
serfbound-boundaries-ok
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.
serfbound-independence-ok: zero .NET artifacts in the tree.
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.
```

## Acceptance criteria — re-checked

- [x] First visit downloads the configured package once; reload uses
  the IndexedDB copy without a second package request. The browser spec
  aborts the fixture route on reload and still restores the package.
- [x] A checksum-mismatched package is rejected recoverably and never
  activates; the start button stays disabled.
- [x] Import-your-own-data still works end to end and visibly coexists:
  the same browser spec imports generated `SPAU.PA` after package
  activation and verifies the source switches to `Imported data`.
- [x] Permission-condition checks run in the release gate via
  `npm run check:licensed-assets`.

## Deferred to SB-31-04

- The public real-URL package run and phone/desktop screenshots remain
  SB-31-04 evidence. SB-31-03 proves the configured hosted delivery
  path using CI-safe generated fixture packages and keeps raw original
  archives out of the repository/release artifact.
