# SB-43-07 — Gallery, Library, and Device Gate

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-43-01, SB-43-03, SB-43-04, SB-43-05, SB-43-06
- **Unblocks:** Phase 43 closeout
- **Owner:** unassigned

## Problem

Phase 43 had the service, client, moderation, play-count, and
multiplayer contracts, but the player-facing browser path was still
missing. A maintainer needed to publish an authored map, see it in the
gallery, rate/report it, download it into a local library, and play it
with their own game data.

## What ships

- The shell now resolves `mapsUrl` alongside identity/mailbox endpoints,
  with `?mapsApi=` for local gates and `/maps` on the deployed base by
  default.
- A Community maps panel browses the gallery, filters by player count,
  sorts cards, signs in for map actions, publishes the open editor map,
  rates, reports, downloads, and plays.
- Downloaded maps persist in the `serfbound-custom-maps` IndexedDB
  library store.
- Published maps carry a PNG data-URL thumbnail generated from the
  sprite-free false-color thumbnail renderer.
- Starting a community map closes the editor first, then runs the same
  local custom-map seam as Phase 42.

## Acceptance criteria

- [x] Browser gate proves publish → browse → rate → report → download
  → local-library → play against local identity + maps services.
- [x] Downloaded maps persist through the local library helper contract.
- [x] The gallery never requires original sprites; thumbnails are
  generated from the sprite-free renderer.
- [x] The maps sign-in path does not depend on the mailbox service.
- [x] Full unit, browser, boundary, design, and docs gates are green.

## Honest limits

- This story proves the local browser/service device gate in CI. Public
  production re-verification can use the same `?mapsApi=`/default
  wiring once the next deployment carries the browser bundle.
- The gallery uses the Phase 43 service's simple report-quarantine
  posture; maintainer adjudication tooling remains outside this phase.
