# Evidence — SB-31-04 — Zero-Import Play Gate

- **Started:** 2026-06-22
- **Shipped:** 2026-06-22
- **Status:** done
- **Commit:** 286aaf6 (package source) + this commit (public proof)
- **Owner:** KC (agent-assisted)

## Files touched

- `public/licensed-assets/manifest.json` — live default manifest served by
  `serfbound.com`.
- `public/licensed-assets/serfbound-demo-dos-en.sb31.json` — converted
  runtime package generated from the consented DOS EN demo corpus; no raw
  original archive is committed or served.
- `scripts/audit-licensed-asset-public-url.mjs` — public-origin legal and
  provenance audit.
- `tests/browser/zero-import-play-gate.spec.ts` — CI fixture gate for first
  visit, active play, and offline cache restore.
- `pm/roadmap/serfbound/phase-31-licensed-asset-delivery/artifacts/` — live
  desktop/phone first-visit and offline-restored screenshots.
- `story-04-zero-import-play-gate.md`, `current-phase-status.md`,
  `final-summary.md`, and `pm/roadmap/serfbound/README.md` — SB-31-04 and
  Phase 31 closeout.

## Deployment

```text
> git push origin main
To https://github.com/karolswdev/serfbound.git
   760ad02..286aaf6  main -> main

> gh workflow run pages.yml --repo karolswdev/serfbound --ref main

> gh run watch 27974394616 --repo karolswdev/serfbound --exit-status
✓ main pages · 27974394616
✓ build in 4m45s (ID 82788329039)
✓ deploy in 11s (ID 82789267545)
```

## Live Public Audit

```text
> npm run audit:licensed-assets:public -- --base https://serfbound.com

> serfbound-workspace@0.2.0 audit:licensed-assets:public
> npm run build && node scripts/audit-licensed-asset-public-url.mjs --base https://serfbound.com

> serfbound-workspace@0.2.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

serfbound-public-licensed-asset-audit-ok manifest=https://serfbound.com/licensed-assets/manifest.json package=https://serfbound.com/licensed-assets/serfbound-demo-dos-en.sb31.json packageChecksum=fnv1a32:3ddba0a7 sourceChecksum=fnv1a32:08dbd8c7 archiveName=SPAU.PA byteLength=1282805 resources=34 sprites=2233 sfx=39 music=4
```

## Live Desktop And Phone Gate

Clean browser contexts were opened against `https://serfbound.com/`. Each
context waited for `Licensed package ready`, verified
`data-serfbound-active-data-source="licensed-asset-package"`, clicked
`Start game`, reached `Running`, then reloaded offline from the same browser
context and started again from the cached package. The package was downloaded
exactly once per context.

```text
{
  "baseUrl": "https://serfbound.com/",
  "desktop": {
    "name": "desktop",
    "packageDownloads": 1,
    "facts": {
      "active": "licensed-asset-package",
      "licensedState": "restored",
      "startMode": "licensed-package",
      "gameState": "running"
    }
  },
  "phone": {
    "name": "phone",
    "packageDownloads": 1,
    "facts": {
      "active": "licensed-asset-package",
      "licensedState": "restored",
      "startMode": "licensed-package",
      "gameState": "running"
    }
  }
}
```

Screenshots:

```text
pm/roadmap/serfbound/phase-31-licensed-asset-delivery/artifacts/sb-31-04-desktop-zero-import-running.png      1280 x 720
pm/roadmap/serfbound/phase-31-licensed-asset-delivery/artifacts/sb-31-04-desktop-offline-restored-running.png 1280 x 720
pm/roadmap/serfbound/phase-31-licensed-asset-delivery/artifacts/sb-31-04-phone-zero-import-running.png        1170 x 7278
pm/roadmap/serfbound/phase-31-licensed-asset-delivery/artifacts/sb-31-04-phone-offline-restored-running.png   1170 x 7332
```

## CI And Release Gates

Run before deployment on the Phase 31 package commit:

```text
> npm run test:browser
36 passed

> npm run test:unit
# tests 340
# pass 340
# fail 0

> npm run test:docs
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.

> npm run check:licensed-assets
serfbound-licensed-asset-release-ok: consent/boundary present, raw archives absent, 2 hosted package artifact(s) verified.

> npm run check:boundaries
serfbound-boundaries-ok

> npm run check:media
serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.

> npm run check:independence
serfbound-independence-ok: zero .NET artifacts in the tree.

> npm run check:design
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.

> npm run check:manifests
Summary: 20 resources found in 8 files - Valid: 20, Invalid: 0, Errors: 0, Skipped: 0

> npm run test:release:static
serfbound-release-artifact-ok: inspected 59 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.

> git diff --check
ok
```

## Legal Re-Audit

- `LICENSE-CONSENT.md` is committed and cited by the asset/legal boundary.
- The served manifest records `permissionRecord: "LICENSE-CONSENT.md"` and
  `pmoStory: "SB-31-01"`.
- The served package checksum and embedded content checksum verify:
  `packageChecksum=fnv1a32:3ddba0a7`, `sourceChecksum=fnv1a32:08dbd8c7`.
- The public audit probes common raw archive paths and passed, so
  `serfbound.com` is not serving raw `SPAU.PA`, `SOUNDS.PA`, or original
  executable paths.
- The import path remains intact and first-class: CI browser coverage proves
  hosted packages coexist with imported `SPAU.PA`, and the app guards against a
  late hosted-package response overriding user-imported data.
- Player-facing docs and README distinguish the Serfbound-distributed licensed
  package from imported local data; imported local data still never uploads.

## Acceptance Criteria Status

- [x] Clean browser on the public URL reaches active play with zero import
  steps.
- [x] Same browser, offline, starts the game from the cached package on the
  second visit.
- [x] Legal re-audit is recorded against the shipped public artifact.
- [x] Player guide and README document both paths without conflating imported
  local data with Serfbound-distributed licensed packages.
