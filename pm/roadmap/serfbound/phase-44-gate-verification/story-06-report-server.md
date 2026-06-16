# SB-44-06 — The Report Server

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-04 (the report markdown), SB-44-05 (the hosted deck that submits)
- **Unblocks:** the maintainer and the harness working a device run together — a submitted report becomes a file in the repo
- **Owner:** unassigned

## Problem

The deck could compile a report and the in-game HUD could too, but the only
way to hand one back was Copy/Download — a manual file the maintainer then
had to ferry to the harness. The maintainer asked for an *actual report
server*: submit pass/fail/comments from the protocol, and have each run
saved as a file we both work on later.

## What ships

A **reports service** — the fourth member of the zero-dependency service
family (identity, mailbox, maps).

- **`services/reports/server.mjs` + `Dockerfile`.** `POST /reports` stores a
  submitted report (hand-typed markdown + small metadata) as its own
  record; `GET /reports` lists, `GET /reports/:id` fetches; `/health` is
  open. Write and read are gated by a shared submit token
  (`SERFBOUND_REPORTS_TOKEN`) the maintainer holds. JSON-file storage,
  size-capped, CORS-enabled. There is no field for original game data.
- **Deploy.** `deploy/reports.yaml` (PVC + Deployment + Service, mirroring
  maps), the `/reports` route on `api.serfbound.com` (httproute), `reports`
  added to the services CI image list, and a runbook in `deploy/README.md`
  (incl. creating the `reports-token` secret). The token env uses
  `optional: true` so the pod starts before the secret exists, then gating
  activates.
- **Deck Submit.** The Results slide gains a token field + **⇪ Submit
  report** button that POSTs the built report to the service. Mark
  pass/fail/comment, submit — all in the hosted protocol.
- **`npm run pull:reports`** (`scripts/pull-reports.mjs`) fetches every
  submitted report into
  `pm/.../phase-44-gate-verification/playtest/reports/*.md` — the shared
  work surface: the maintainer plays and submits, the harness reads the
  files and we act on the fails.

## freeserf.net boundary

Held. A report is human-authored markdown; the wire format and storage have
no field for sprites, audio, or save state. The service touches no engine,
asset, or player-runtime code — it is a sibling of the existing services.

## Acceptance criteria

- [x] The service contract holds: token-gated submit/list/fetch, empty and
  oversized rejected, health open (`tests/ci/service-reports.test.mjs`, 6
  assertions).
- [x] Deploy manifests validate (`check:manifests`, 20/20) and the route +
  CI list carry `reports`.
- [x] The deck's Submit button POSTs a report and reports success; the
  service stores it (browser-verified against a local instance).
- [x] `npm run pull:reports` writes each submitted report into the repo as
  its own file (verified against a local instance).
