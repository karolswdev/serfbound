# SB-43-02 — Deploy to the Backbone

- **Project:** serfbound
- **Phase:** 43
- **Status:** done (applied to LKE lke577204 on 2026-06-13)
- **Depends on:** SB-43-01
- **Unblocks:** SB-43-03, SB-43-04
- **Owner:** maintainer (the apply)

## Problem

The maps service must run at `/maps` on `api.serfbound.com`, on the
same LKE backbone the identity/mailbox services already use, without
touching the static game or the existing services.

## What is staged (this commit)

- `deploy/maps.yaml` — PVC + Deployment + Service, cut to the
  identity/mailbox manifest: one replica, `Recreate` over the RWO
  store, TCP probes, the `ghcr.io/karolswdev/serfbound-maps:latest`
  image, store on `/data/maps.json`.
- `deploy/httproute.yaml` — a `/maps` PathPrefix rule on the shared
  catalyst gateway, rewritten to the service root (the same
  path-split as `/identity` and `/mailbox`). The cert already covers
  `api.serfbound.com` — no certificate change.
- `.github/workflows/services.yml` — the image build/push loop now
  includes `maps`, so the GHCR image publishes on the next `main`
  push that touches `services/**` or `deploy/**`.
- `deploy/README.md` — the deploy runbook (the exact `kubectl`
  sequence) and rollback.

All manifests validate: `npm run check:manifests` (kubeconform
-strict) reports **17/17 valid**.

## The deploy (the maintainer's outward action)

Per the asset/infra posture, the apply to the live cluster needs the
LKE kubeconfig (gitignored under `serfbound-local-data/infra/`) and the
maintainer's go — it is not done by the agent. The runbook in
`deploy/README.md` is the exact sequence:
`kubectl apply -f deploy/maps.yaml`, re-apply `httproute.yaml`, roll
out, then smoke-test `GET https://api.serfbound.com/maps` for an empty
gallery.

## Exit criteria (evidence required, on deploy)

- [ ] `https://api.serfbound.com/maps` is live and returns `{"maps":[]}`
  on a fresh store (the maintainer captures the curl).
- [ ] Game-down-independence: the static game and local play are
  untouched whether the maps service is up or down.

## Honest limits

- This story's engineering (manifests, route, CI, runbook) is
  complete and validated; the story stays **staged**, not done, until
  the maintainer runs the apply and captures the live smoke-test — the
  PMO "evidence on disk" rule for an outward deploy.
