# Evidence — SB-43-04 — Custom Maps in Multiplayer

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/session-protocol.ts` — `sessionProtocolVersion`
  `1` → `2`; `mapContentHash?: number | null` on `SessionGameSettings`;
  the `map-mismatch` verdict in `verifySessionHandshake` (absent ≡
  null); `decodeHello` validates the field and keeps a v1-shaped hello
  byte-exact.
- `tests/ci/engine-session-protocol.test.mjs` — the v2 handshake/
  round-trip cases and the custom-map lockstep determinism proof; the
  pre-existing protocol-version-mismatch case now uses
  `sessionProtocolVersion + 1` (it hard-coded `2`, which is now live).

## Verification artifacts

```
gate, stash-verified failing pre-fix (revert session-protocol.ts only,
keep the tests, rebuild engine):
  not ok 4 - the session protocol is at v2 — the community-map handshake
  not ok 5 - handshake matches equal map hashes and rejects different ones
  not ok 6 - a hello round-trips the mapContentHash, and a bad one is rejected
  # pass 5 / fail 3
post-fix:
  ok 4 - the session protocol is at v2 — the community-map handshake
  ok 5 - handshake matches equal map hashes and rejects different ones (v2)
  ok 6 - a hello round-trips the mapContentHash, and a bad one is rejected
  ok 7 - a community map plays deterministically in lockstep — no divergence
  engine-session-protocol: # tests 8 / pass 8

npm test            -> exit=0 (unit + build + 32 browser specs)
npm run ci:release  -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Protocol v2: equal hashes match, different reject (`map-mismatch`),
  absent ≡ null, the hash round-trips, a bad one is refused
  (CI-gated, stash-verified).
- [x] A community map runs divergence-free in lockstep
  (`firstChecksumDivergence === null`); the content hash is stable.
- [x] Seed-based handshake and existing lockstep/correspondence parity
  unchanged; full sweep + release + compatibility green.

## Note

The on-screen wiring — populating `mapContentHash` from a downloaded
map record in the online lobby and starting the match on it — is the
browser surface for the device gate (SB-43-05). The map bytes never
cross the session wire; each peer downloads the map and verifies this
hash. The determinism proof drives the real `customMap` seam end to end
with catalog-only metadata (no SPAU.PA), so it runs clean in CI.
