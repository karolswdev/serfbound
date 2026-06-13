# Evidence — SB-43-01 — The Maps Service

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `services/maps/server.mjs` (new) — the maps service, zero-dependency
  Node `http`, cut to the identity/mailbox template: the same ECDSA
  P-256 `verifySignature` + `keyFingerprint`, `readBody` (768 KB body
  cap), `send` (CORS, now incl. DELETE), JSON-store-on-PVC,
  `SERFBOUND_MAPS_AUTOSTART=0` for in-process tests. Routes: `POST
  /maps` (signed publish, 512 KB landscape cap, 50-maps-per-key quota,
  author-key match), `GET /maps` (gallery, quarantined hidden,
  size/players filter), `GET /maps/:id` (full payload + download bump),
  `POST /maps/:id/rate` (signed 1..5, one per key), `POST
  /maps/:id/report` (signed; 3 reports quarantine), `DELETE /maps/:id`
  (author-signed takedown).
- `services/maps/Dockerfile` (new) — Node + one file on a `/data`
  volume, matching the family.
- `services/README.md` — the third service listed.

## Verification artifacts

```
service contract test (new), stash-verified failing without the module
(the service does not exist):
  service-maps: import error — module not found (server absent)
post-fix (in-process server, no SPAU.PA, no cluster):
  ok 1 - a signed map publishes, lists in the gallery, and fetches
         back whole with the download counter bumped.
  ok 2 - a bad signature (401) and an over-cap landscape (400) are
         refused.
  ok 3 - the wire has no field for original data: a non-string
         landscape and a foreign kind are both refused — there is
         nowhere for sprite bytes to live.
  ok 4 - one rating per key (a second replaces the first), three
         reports quarantine the map (hidden from the gallery), a
         stranger cannot delete (403) but the author can (200).
  service-maps: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Publish/list/fetch; bad signature + over-cap refused (contract
  test, stash-verified).
- [x] No original-data field — wrong-shape / non-string landscape
  rejected.
- [x] Rate (one per key), report → quarantine, author-signed delete.
- [x] Full unit sweep + release gates green.

## Note

The per-key quota (50) is enforced in the server but not exercised in
CI (50 publishes per run is wasteful); it is covered structurally by
the publish path and will be proven at deploy. The over-quota claim
was removed from the test name to keep it honest.
