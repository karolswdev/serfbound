# SB-44-13 — Tappable Verdicts: Finger-Sized Buttons and No Stale Deck

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-12 (the verdict-box rename)
- **Owner:** unassigned

## Problem

After SB-44-12 fixed the `.controls` collision, the maintainer still
couldn't mark verdicts on the device — "it's like those buttons aren't
active." Two real causes, neither reproducible in a fresh test browser:

1. **Tiny tap targets.** Reveal scales a 1100px slide to fit the screen;
   on a ~390px phone that's ~0.35×, leaving the verdict buttons **~18px
   tall** — below a usable finger target, so taps miss or feel dead.
2. **A stale cached deck.** The service worker (`serfbound-shell-v2`,
   scope `/`) caches navigations, and the deploy never bumped the cache
   name — so a browser that once loaded the old (pre-fix) deck could keep
   serving it, where the collision made the verdict area `display:none`.

## What ships

- **Finger-sized buttons.** The deck sizes reveal for a phone
  (`width:480, height:850`, `minScale:0.4, maxScale:1.6`) so it barely
  scales down on a device — the verdict buttons render **~43px tall** (the
  ~44px target floor) and stay readable, while `maxScale` caps the desktop
  zoom.
- **Never a stale deck.** The service-worker cache bumps to
  `serfbound-shell-v3` (force-clearing old caches on the next visit), and
  `/playtest/` + `/rigs/` are now fetched **network-only** (fall back to
  cache only when offline, and never store a copy that could shadow a newer
  deploy). The deck and rigs are always the freshest build.

## freeserf.net boundary

Held. Deck tooling + the app-shell service worker (no original data; the
`.pa` guard is unchanged).

## Acceptance criteria

- [x] At a 390px phone width the verdict button is ~43px tall (was ~18) and
  a real tap records the verdict (`deck-phone-check.png`).
- [x] The SW serves `/playtest/` + `/rigs/` network-first without caching a
  stale copy; cache name bumped to v3.
- [x] All deck behaviour intact (`verify-deck.mjs`, 31 ok).
