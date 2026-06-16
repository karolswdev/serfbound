# SB-44-05 — Host the Protocol Deck

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-03 (the deck's rig deep-links + shared verdict store)
- **Unblocks:** SB-44-06 (the report server's client is the hosted deck); on-device use of the deck as the protocol home
- **Owner:** unassigned

## Problem

The gate-verification deck (SB-44-01..03) was complete — sequenced checks,
Pass/Fail/Skip + notes, a compiled report, and per-check "Open rig"
deep-links — but it lived only in `pm/` and was never served. So the
maintainer couldn't reach it, and because it wasn't same-origin with the
game, its rig deep-links and verdict store didn't line up with the in-game
HUD.

## What ships

A tiny vite plugin (`vite.config.ts`, `serfbound-publish-playtest-deck`)
copies the deck's `index.html` into the build output at `dist/playtest/`
on every `build:web`. The deck is therefore published at
`serfbound.com/playtest/` — same origin as the game. Same origin means its
manifest fetch (`./rigs/manifest.json`), its rig deep-links
(`/?rig=<id>`), and its `localStorage` verdict store all line up with the
in-game HUD: capture in either surface, one report.

The deck stays sourced in `pm/` (single source of truth); the plugin only
copies it into the artifact, so there is no committed duplicate to drift.

## freeserf.net boundary

Held. The deck is verification tooling (no engine/asset/player-runtime
code); publishing it adds a static page that carries no original game
data. The build artifact gains one self-contained HTML file.

## Acceptance criteria

- [x] `npm run build:web` writes `dist/playtest/index.html` (the deck),
  shipping it with the GitHub Pages deploy.
- [x] Served same-origin, the deck's rig deep-links and verdict store match
  the game's (verified by the SB-44-03 deck assertions, unchanged).
- [x] The deck remains sourced once in `pm/`; no duplicate committed.
