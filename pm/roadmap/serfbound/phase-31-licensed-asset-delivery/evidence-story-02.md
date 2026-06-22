# Evidence — SB-31-02 — Deterministic Asset Conversion Pipeline

- **Shipped:** 2026-06-22
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/assets/src/licensed-package.ts` — `sb31-runtime-v1`
  licensed package converter, canonical encoder/decoder, inspector,
  verifier, decoded sprite/SFX helpers, provenance and checksum
  metadata.
- `packages/assets/src/index.ts` — exports the package API from
  `@serfbound/assets`.
- `scripts/convert-licensed-assets.mjs` — operator CLI:
  `--input/--output` conversion and `--inspect` verification.
- `package.json` — adds `npm run convert:licensed-assets`.
- `tests/ci/asset-licensed-package.test.mjs` — CI-safe generated archive
  coverage for deterministic conversion, provenance, direct-decoder
  parity, SFX/music packaging, and corruption rejection.
- `docs/developer-guide.md` — documents the conversion/inspection path.
- `pm/roadmap/serfbound/phase-31-licensed-asset-delivery/*` — roadmap
  status updated for SB-31-02.

## Verification artifacts

```text
> serfbound-workspace@0.2.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app
```

```text
TAP version 13
# Subtest: licensed asset conversion is deterministic and records SB-31-01 provenance
ok 1 - licensed asset conversion is deterministic and records SB-31-01 provenance
# Subtest: licensed package payloads match the direct DOS decoders
ok 2 - licensed package payloads match the direct DOS decoders
# Subtest: licensed package verification rejects content drift
ok 3 - licensed package verification rejects content drift
1..3
# tests 3
# pass 3
# fail 0
```

```text
> serfbound-workspace@0.2.0 test:unit
> npm run build && node --test tests/ci/*.test.mjs

1..332
# tests 332
# pass 332
# fail 0
```

```text
> serfbound-workspace@0.2.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok
```

```text
> serfbound-workspace@0.2.0 test:docs
> node scripts/check-docs.mjs

serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
```

```text
> serfbound-workspace@0.2.0 check:media
> node scripts/check-readme-media.mjs

serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.
```

Generated-fixture CLI conversion:

```text
{
  "output": ".tmp/sb31-generated-assets.json",
  "packageChecksum": {
    "algorithm": "fnv1a32",
    "value": "662255fe"
  },
  "inspection": {
    "packageChecksum": {
      "algorithm": "fnv1a32",
      "value": "662255fe"
    },
    "contentChecksumValid": true,
    "sourceChecksum": {
      "algorithm": "fnv1a32",
      "value": "d9e2ec46"
    },
    "archiveName": "SPAU.PA",
    "byteLength": 254419,
    "resourceCount": 34,
    "spriteCount": 630,
    "serfTorsoCount": 1,
    "sfxCount": 7,
    "musicTrackCount": 1
  }
}
```

Generated-fixture CLI inspection:

```text
{
  "packageChecksum": {
    "algorithm": "fnv1a32",
    "value": "662255fe"
  },
  "contentChecksumValid": true,
  "sourceChecksum": {
    "algorithm": "fnv1a32",
    "value": "d9e2ec46"
  },
  "archiveName": "SPAU.PA",
  "byteLength": 254419,
  "resourceCount": 34,
  "spriteCount": 630,
  "serfTorsoCount": 1,
  "sfxCount": 7,
  "musicTrackCount": 1
}
```

## Acceptance criteria — re-checked

- [x] Two conversion runs over the same archive produce byte-identical
  packages; package/content checksums and the SB-31-01 provenance block
  verify through the inspector.
- [x] Package payloads match direct import-path decoders for generated
  fixture sprites, SFX, and parsed music. Real-data parity remains
  opt-in, unchanged by CI.
- [x] CI-safe generated fixture coverage exists; no original data is
  committed or required.
