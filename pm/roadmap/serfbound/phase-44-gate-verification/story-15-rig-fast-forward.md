# SB-44-15 — Fast-Forward in the Rig Debugger

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-12 (the embedded rig/debug chrome)
- **Owner:** unassigned

## Problem

A rig plays out over many ticks — a road staffs, trees grow, knights march
— so the maintainer had to wait real seconds-to-minutes watching for the
behaviour, with no way to hurry the clock.

## What ships

A **fast-forward bar** in the rig debugger. When the game runs embedded in
the deck (a `?rig=` session), a small speed control mounts with **⏸ / 1× /
2× / 4× / 8× / 20×** — wired to the existing `setGameSpeed` multiplier, so
the maintainer can run the sim up to 20× (or pause it) and see staffing,
growth, and combat in seconds. Mounted only in the embedded debug session;
the active speed is highlighted in gold.

## freeserf.net boundary

Held. Reuses the engine's existing `gameSpeedMultiplier` (no engine change);
the bar is a `?rig=`-gated debug overlay (tokenized CSS), never in normal
play.

## Acceptance criteria

- [x] The speed bar mounts in an embedded rig with ⏸/1×/2×/4×/8×/20×.
- [x] Clicking 20× sets the game speed to 20 and the rig staffs quickly
  (serfs appear within seconds — browser-verified).
- [x] `check:design` green (tokenized, ratchet 0/0).
