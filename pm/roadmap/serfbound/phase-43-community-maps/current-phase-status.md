# Phase 43 — Community Maps (sharing)

**Last updated:** 2026-06-22 (SB-43-05 done: metadata moderation now
filters title/author names before storage, the 50-maps-per-key quota is
CI-held, and the existing report-quarantine contract remains green. The
on-screen gallery/library and device gate remain in SB-43-07. Earlier:
SB-43-04 protocol hash, SB-43-03 client + thumbnail, SB-43-01 service,
SB-43-06 play counts).
**Status:** in progress — SB-43-02 DEPLOYED (maps live on
api.serfbound.com); SB-43-07 gallery/library + device gate is the only
remaining story.

## Goal

Share authored maps on serfbound.com: publish, browse, search, rate,
report, and download community maps, and play them — including in
multiplayer — verified by checksum the same way generated maps are.
Browsing needs no imported data because gallery **thumbnails are
sprite-free false-color** (`minimapTerrainColors`) — this keeps the
service clean of original art, not because the editor is asset-free
(it is import-gated and authentic, Phase 42). A downloaded map plays
with the player's own assets, like any map. Sharing reuses the
existing backbone (device-key identity, the zero-dependency service
template) and never puts original game data on the wire.

## Codebase / backbone ground truth

- The maps service is a third zero-dependency Node `http` server cut to
  the identity/mailbox template (services/README.md): signature-verify,
  store, forward, never referee; one JSON store on a PVC, `Recreate`.
- Device-key ECDSA P-256 signatures (the Phase 25/29 identity) attest
  authorship; a map can't be published under another's key.
- Determinism lives in the pipeline, not the map: two clients with the
  same six arrays + same actions produce the same `computeGameChecksum`.
  The multiplayer handshake adds `mapContentHash` (FNV-1a over canonical
  bytes) under `sessionProtocolVersion` v2 — shipped LAST so it cannot
  corrupt existing lockstep/correspondence parity.
- The hosting backbone (hosting-infrastructure-decision.md): own
  namespace, catalyst Envoy gateway + cert-manager, `/maps` on
  `api.serfbound.com`; a 512 KB payload cap + per-key quota now,
  Object-Storage escalation recorded for later.

## Exit criteria (evidence required)

- [x] The maps service: publish/list/fetch with signature verification,
  structural+size validation, payload cap + per-key quota; the "no
  original-data field exists" contract test green. (SB-43-01)
- [x] Deployed to the backbone: `/maps` live on `api.serfbound.com`,
  game-down-independence proven. (SB-43-02 — APPLIED 2026-06-13 to LKE
  lke577204: maps Deployment 1/1 + Service + 10Gi PVC, the
  `serfbound-api` route carrying the /maps rule;
  `GET /maps/maps` -> `{"maps":[]}` HTTP 200.)
- [~] The gallery + library shell: browse/filter/sort/rate/report with
  sprite-free false-color thumbnails. (SB-43-03 — the signed client and
  the pure thumbnail are CI-held; the on-screen shell, library store,
  and PNG wrapper ride the device gate SB-43-05.)
- [~] Custom maps in multiplayer: handshake v2 with `mapContentHash`,
  a lockstep/correspondence match on a custom map with
  `firstChecksumDivergence === null`. (SB-43-04 — the protocol + the
  CI determinism proof are done; the on-screen lobby wiring of a
  downloaded map and the dual-attested result ride the device gate
  SB-43-05.)
- [x] Moderation contracts: report → quarantine, title/author filtering,
  and per-key publish quota are CI-held. (SB-43-05)
- [ ] Gallery/library and on-device gate: the maintainer publishes,
  browses, downloads, and plays a community map. (SB-43-07)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-43-01 | The maps service | done | story-01-the-maps-service.md | evidence-story-01.md |
| SB-43-02 | Deploy to the backbone | done | story-02-deploy-to-the-backbone.md | evidence-story-02.md |
| SB-43-03 | The gallery and library shell | done | story-03-the-gallery-and-library-shell.md | evidence-story-03.md |
| SB-43-04 | Custom maps in multiplayer | done | story-04-custom-maps-in-multiplayer.md | evidence-story-04.md |
| SB-43-05 | Moderation contracts | done | story-05-moderation-device-gate.md | evidence-story-05.md |
| SB-43-06 | Play counts (opt-in) | done | story-06-play-counts.md | evidence-story-06.md |
| SB-43-07 | Gallery, library, and device gate | backlog | — | — |

## Boundaries

- Hard-depends on Phase 42's format (SB-42-01) and editor; no Phase 43
  story opens until the format round-trips and the editor ships.
- SB-43-04 (the handshake change) is the only place a bad design could
  corrupt existing multiplayer parity — sequenced last, on a proven
  format and determinism story.
- 2026-06-22 — SB-43-05 backend slice: publish sanitizes title and
  author display name before storage/gallery/fetch exposure; quota is
  now proven by the service contract suite.
