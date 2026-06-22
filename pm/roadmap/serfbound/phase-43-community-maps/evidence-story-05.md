# Evidence — SB-43-05 — Moderation Contracts

- **Shipped:** 2026-06-22
- **Status:** done
- **Owner:** KC (agent-assisted)

## 2026-06-22 — Metadata and Quota Contract Slice

Files touched:

- `services/maps/server.mjs` — published map title and author name are
  now sanitized before storage; titles cap at 40 game-font-safe
  characters with spaces, author names cap at 12 game-font-safe
  characters without spaces. Empty filtered values fall back to
  `UNTITLED` / `PLAYER`.
- `tests/ci/service-maps.test.mjs` — added SB-43-05 contract coverage
  for metadata filtering and per-key quota.

Verification:

```text
npm run build && node --test tests/ci/service-maps.test.mjs tests/ci/app-maps-client.test.mjs

ok 6 - metadata moderation filters title/author and per-key quota stops spam (SB-43-05)
1..8
# tests 8
# pass 8
# fail 0
```

Acceptance criteria checked in this slice:

- [x] Metadata moderation is contract-tested.
- [x] The 50-maps-per-key quota is contract-tested.
- [x] Existing report -> quarantine contract remains green in the same
  service suite.

Remaining Phase 43 work moved to SB-43-07: on-screen gallery/library,
downloaded map local play, downloaded map multiplayer hash wiring, and
the maintainer on-device gate.
