# SB-43-04 — Custom Maps in Multiplayer

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-43-01, SB-42-01, SB-22-03
- **Unblocks:** SB-43-05
- **Owner:** unassigned

## Problem

Two peers playing a generated map already verify they agree on the
seed before a tick runs. A community map has no seed — its determinism
lives in its six canonical arrays. So the handshake needs the map's
content hash: peers must prove they hold the _same_ downloaded map, the
same way they prove the same seed, or lockstep diverges silently. This
must extend the handshake without touching tick execution, so it ships
after the lockstep/correspondence parity is proven.

## What ships

- `sessionProtocolVersion` → `2`, with `mapContentHash?: number | null`
  on `SessionGameSettings`. A generated map leaves it null/absent; a
  community map carries the FNV-1a hash of its canonical bytes.
- `verifySessionHandshake` rejects a `map-mismatch` when the hashes
  differ (and treats absent ≡ null, so a seeded session is unchanged).
- `decodeSessionMessage` validates the field (null or integer) and
  preserves byte-exact round-trips for a v1-shaped hello (absent stays
  absent).
- A CI proof that a community map plays divergence-free in lockstep:
  two peers start from the same map record, run the identical schedule,
  and `firstChecksumDivergence` is `null`.

## Acceptance criteria

- [x] Protocol v2: the handshake matches equal map hashes, rejects
  different ones (`map-mismatch`), treats absent ≡ null, and a hello
  round-trips the hash (a bad one is refused) — CI-gated, stash-verified.
- [x] A community map runs deterministically in lockstep:
  `firstChecksumDivergence === null` over a real schedule, and the
  map's content hash is stable over its bytes (CI-gated).
- [x] Existing seed-based handshake and lockstep/correspondence parity
  unchanged; full unit sweep + release + compatibility gates green.

## Honest limits

- This is the protocol + determinism contract. Wiring a downloaded
  community map into the online lobby/handshake on screen (populating
  `mapContentHash` from a fetched record and starting the match on it)
  is the browser surface proven at the device gate (SB-43-05), like the
  gallery shell in SB-43-03.
- The map bytes never cross the session wire: peers each download the
  map from the maps service and verify this hash. No original game data
  is involved — the map is user-authored enum data.
