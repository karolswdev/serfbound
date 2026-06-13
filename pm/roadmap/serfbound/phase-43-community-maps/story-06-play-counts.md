# SB-43-06 — Play Counts (opt-in)

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-43-01
- **Unblocks:** SB-43-03 (the gallery shows it)
- **Owner:** unassigned

## Problem

The maintainer wants a "times played" stat on community maps. The
gallery already carries title, author, thumbnail, rating, rating
count, downloads, size, players, and publish date — but not a play
count. The catch is the project's unbreakable: play is **serverless
and accountless** by default, and there are **no server-side play
logs**. A naive play counter would mean phoning home on every local
match — surveillance the posture forbids.

## The privacy-respecting design

A play is counted only when a **signed-in** player **chooses** to
report it: a signed `POST /maps/:id/played`. Because the endpoint
requires a device-key signature, an accountless player (the default)
never calls it and is never counted or seen — the unbreakable holds.
The counter undercounts by design; it is a popularity signal from the
players who opted into accounts, not a surveillance metric.

## What ships

- `POST /maps/:id/played` on the maps service: verify the signature
  (which gates it to accounts), increment `timesPlayed`.
- `timesPlayed` in `galleryView` and the stored entry, so the gallery
  and fetch views carry it alongside downloads/ratings.

## Acceptance criteria

- [x] A signed play-ping increments `timesPlayed`, visible in the
  gallery and on fetch; an unsigned/bad-signed ping is refused
  (contract test, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The counter is opt-in and signed, so it undercounts (accountless
  play is invisible by design) and a colluding key can inflate it —
  "recorded, not defended," exactly as ratings and the ladder are.
- The app wiring (firing the ping when a signed-in, opted-in player
  starts/finishes a custom-map match) is the gallery/library work
  (SB-43-03) + the device gate; this story is the service endpoint
  and the field.
