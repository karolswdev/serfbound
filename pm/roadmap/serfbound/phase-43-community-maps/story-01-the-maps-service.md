# SB-43-01 — The Maps Service

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-42-01 (the format)
- **Unblocks:** SB-43-02, SB-43-03
- **Owner:** unassigned

## Problem

Sharing needs a service to publish and serve authored maps. It must be
the third member of the existing family — a zero-dependency Node `http`
server cut to the identity/mailbox template (signature-verify, store,
forward, never referee; one JSON store on a PVC) — and it must hold the
boundary: no original game data has a field on the wire, payloads are
size-capped, and the game never depends on it.

## Codebase ground truth

- `services/mailbox/server.mjs` / `services/identity/server.mjs`: the
  template — `createServer`, `readBody` (size-capped), `send` (CORS),
  ECDSA P-256 `verifySignature` + `keyFingerprint`, JSON-store-on-PVC,
  `SERFBOUND_*_AUTOSTART=0` for in-process tests, a Dockerfile that is
  Node + one file on a `/data` volume.
- `generateIdentityKeys` / `signIdentityPayload` (app): the device-key
  signing the contract test drives.
- `SerfboundCustomMap` (SB-42-01): the payload — enum bytes + text, no
  sprite field.

## What ships

- `services/maps/server.mjs` + `Dockerfile`: the maps service.
  - `POST /maps` — verify the author's signature over the map content
    hash, structurally validate the record, enforce the 512 KB payload
    cap and a 50-maps-per-key quota, store, return `{ mapId }`.
  - `GET /maps` — the gallery (metadata only, quarantined hidden),
    filterable by size/players.
  - `GET /maps/:id` — the full `SerfboundCustomMap`, bumping downloads.
  - `POST /maps/:id/rate` — signed 1..5 stars, one per key.
  - `POST /maps/:id/report` — signed; a threshold quarantines a map.
  - `DELETE /maps/:id` — author-key-signed takedown.

## Acceptance criteria

- [x] A signed map publishes, lists in the gallery, and fetches back
  whole; a bad signature and an oversized payload are refused (service
  contract test, in-process). The 50-per-key quota is enforced in the
  server (proven at deploy, not in CI — recorded).
- [x] The "no original-data field" contract: a non-string landscape
  and a foreign kind are rejected — there is nowhere for sprite bytes
  to live.
- [x] Rate (one per key), report → quarantine (hidden from the
  gallery), and author-signed delete work.
- [x] Full unit sweep + release gates green.

## Honest limits

- The service stores the map's landscape as opaque base64 (it does not
  decode/validate the bytes — that is the client's reject-not-clamp job
  from SB-42-01); the service guarantees shape + size + signature only.
- Deploy to `api.serfbound.com` is SB-43-02 (an outward action on the
  live cluster, gated on the maintainer + kubeconfig); this story is
  the service + its in-process contract test.
- Colluding keys can rate-farm a map exactly as they can the ladder
  ("recorded, not defended," per services/README.md).
