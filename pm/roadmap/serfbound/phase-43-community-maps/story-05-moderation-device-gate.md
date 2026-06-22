# SB-43-05 — Moderation Contracts

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-43-01
- **Unblocks:** SB-43-07
- **Owner:** unassigned

## Problem

Community maps need the modest moderation rules promised by the phase
to be enforced by contract, not just documented in the service:
game-font-safe map titles, game-font-safe author display names, a
per-key publish quota, and reported maps hidden from the gallery. The
service must stay in the existing posture: signed writes, no original
data, simple quota, reported maps hidden, and accountless play
unaffected.

## What ships

- Published titles are stored game-font-safe, capped, and non-empty.
- Published author names are stored game-font-safe, capped, and
  non-empty.
- Per-key publish quota is CI-held, not just a comment.
- Report threshold still quarantines maps from the public gallery.

## Acceptance criteria

- [x] Metadata moderation is contract-tested: title and author name are
  filtered before storage and before gallery/fetch views expose them.
- [x] The 50-maps-per-key quota is contract-tested; the 51st publish
  returns `quota-exceeded`.
- [x] Report threshold quarantines a map and hides it from gallery
  listings.
- [x] Full unit sweep and docs/boundary checks are green.

## Honest limits

This story closes the backend moderation contract only. The
gallery/library UI and maintainer device gate remain in SB-43-07.
