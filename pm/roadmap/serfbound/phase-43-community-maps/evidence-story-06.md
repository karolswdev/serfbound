# Evidence — SB-43-06 — Play Counts (opt-in)

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `services/maps/server.mjs` — `POST /maps/:id/played` (signature-
  verified, so only accounts contribute and accountless play stays
  invisible) increments `timesPlayed`; `timesPlayed` added to the
  stored entry and `galleryView`.

## Verification artifacts

```
service contract gate (new), stash-verified failing pre-fix (the
played route does not exist):
  service-maps play-ping: # pass 0 / fail 1 (server route stashed)
post-fix:
  ok - a signed play-ping increments timesPlayed (1 then 2 — raw
       count); the gallery and the fetch view both carry it; a
       bad-signed ping is refused (401), so accountless play cannot
       be counted.
  service-maps: # tests 5 / pass 5

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Signed play-ping increments times-played (gallery + fetch);
  unsigned refused (contract test, stash-verified).
- [x] Full unit sweep + release gates green.

## Note on the design

The counter is **opt-in and signed**, honoring the serverless/
accountless unbreakable: the default accountless player never pings
and is never counted or logged. It undercounts by design and a
colluding key can inflate it — "recorded, not defended," exactly as
ratings and the ladder are. The app wiring (firing the ping when a
signed-in player plays a custom map) is the gallery/library +
device-gate work (SB-43-03/05).
