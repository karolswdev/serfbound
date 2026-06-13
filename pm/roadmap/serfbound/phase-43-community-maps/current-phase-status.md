# Phase 43 — Community Maps (sharing)

**Last updated:** 2026-06-13 (SB-43-04 done: session protocol v2 — the
handshake carries `mapContentHash` so peers verify they hold the same
community map, with a CI proof that a custom map plays divergence-free
in lockstep. The on-screen lobby wiring rides the device gate. Earlier:
SB-43-03 client + thumbnail, SB-43-01 service, SB-43-06 play counts).
**Status:** in progress — SB-43-02 staged (awaiting the deploy);
SB-43-05 moderation + device gate is the only remaining story.

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
- [~] Deployed to the backbone: `/maps` live on `api.serfbound.com`,
  game-down-independence proven. (SB-43-02 — STAGED: manifests +
  route + CI + runbook complete and kubeconform-valid; the apply is
  the maintainer's outward action.)
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
- [ ] Moderation (report → quarantine, name/title filtering, quota) and
  the on-device gate: the maintainer publishes, browses, downloads, and
  plays a community map. (SB-43-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-43-01 | The maps service | done | story-01-the-maps-service.md | evidence-story-01.md |
| SB-43-02 | Deploy to the backbone | staged | story-02-deploy-to-the-backbone.md | — (awaiting deploy) |
| SB-43-03 | The gallery and library shell | done | story-03-the-gallery-and-library-shell.md | evidence-story-03.md |
| SB-43-04 | Custom maps in multiplayer | done | story-04-custom-maps-in-multiplayer.md | evidence-story-04.md |
| SB-43-05 | Moderation and the device gate | backlog | — | — |
| SB-43-06 | Play counts (opt-in) | done | story-06-play-counts.md | evidence-story-06.md |

## Boundaries

- Hard-depends on Phase 42's format (SB-42-01) and editor; no Phase 43
  story opens until the format round-trips and the editor ships.
- SB-43-04 (the handshake change) is the only place a bad design could
  corrupt existing multiplayer parity — sequenced last, on a proven
  format and determinism story.
