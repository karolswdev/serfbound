# Evidence — SB-44-06 The Report Server

## Service contract (`tests/ci/service-reports.test.mjs`)

```
ok - health is open and needs no token
ok - submit without the token is rejected        (401)
ok - an empty report is rejected                 (400)
ok - a report submits, lists, and fetches round-trip
ok - listing is token-gated too                  (401)
ok - an oversized report is rejected             (413)
# tests 6  # pass 6  # fail 0
```

Full suite after adding the service: `npm run test:unit → # pass 329 # fail 0`.

## Deploy manifests

```
npm run check:manifests
  → Summary: 20 resources found in 8 files - Valid: 20, Invalid: 0
```

`deploy/httproute.yaml` carries the `/reports` rule; `.github/workflows/services.yml`
builds + pushes `serfbound-reports`; `deploy/README.md` documents the apply
(incl. the `reports-token` secret).

## The full loop (local instance)

`POST /reports` (with token) → service stores → `npm run pull:reports` writes
the file into the repo:

```
{"reportId":"d29beb70-...","receivedAtIso":"2026-06-16T13:38:48.073Z"}
✓ 2026-06-16T13-38-48-d29beb70.md  (Gate playtest)
Pulled 1 report(s) → .../playtest/reports/
```

The written file carries an id/received/meta header + the report markdown.

## Deck Submit button (real Chromium, against a local instance)

A Pass recorded on 36.1, token entered, **⇪ Submit report** clicked:

```
submit-status: "✓ saved — id 24a67fe8"
DECK SUBMIT OK
reports on server: 1
```

CORS preflight for the `x-serfbound-report-token` header passes; the deck
served from `file://` reaches the service.
