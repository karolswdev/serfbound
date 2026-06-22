# Evidence — SB-31-01 — Permission Record and Boundary Revision

- **Shipped:** 2026-06-22
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `LICENSE-CONSENT.md` — formal Phase 31 written consent record: parties,
  record date, written confirmation scope, exclusions, and derived PMO
  obligations.
- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` — amended with
  the licensed converted-package path while preserving the import-your-own-data
  path and the raw-archive prohibition.
- `README.md` and `docs/player-guide.md` — drafted the messaging split:
  Serfbound-distributed licensed converted packages are distinct from a
  player's imported local data, which still never uploads.
- `docs/developer-guide.md` — developer posture now forbids unlicensed asset
  hosting while acknowledging the Phase 31 package path.
- `pm/roadmap/serfbound/phase-31-licensed-asset-delivery/*` — story/status
  tracking updated for SB-31-01.
- Phase 42/43-adjacent canon — removed stale "currently verbal-only" wording
  where Phase 31 is referenced.

## Verification artifacts

Command output captured after the documentation update:

```text
> serfbound-workspace@0.2.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.2.0 test:docs
> node scripts/check-docs.mjs

serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.

> serfbound-workspace@0.2.0 check:media
> node scripts/check-readme-media.mjs

serfbound-readme-media-check-ok: 5 referenced, 5 committed, 1230KB of 1465KB budget.
```

## Acceptance criteria — re-checked

- [x] The written record is committed and states parties, date, what may be
  converted, what may be hosted, and conditions/exclusions.
- [x] The boundary canon cites the record and enumerates derived conditions as
  testable obligations for SB-31-02/SB-31-03/SB-31-04.
- [x] README/player-doc messaging distinguishes the hosted licensed package
  from imported local data; no conflation.
