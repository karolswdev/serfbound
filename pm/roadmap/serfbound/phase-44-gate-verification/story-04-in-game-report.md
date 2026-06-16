# SB-44-04 — The In-Game Results Report

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-03 (the rig loader + in-game HUD)
- **Unblocks:** running the whole gate protocol on a device with no deck deployment — the game is the capture *and* hand-back surface
- **Owner:** unassigned

## Problem

SB-44-03 made the in-game HUD capture verdicts, but the hand-back report
— the markdown the maintainer pastes back to close a gate — still lived
only in the deck. The deck shares the verdict store only when it is
served from the game's origin, which it is not yet. So on a real device
the maintainer could rig, play, and record every check in-game, then have
nowhere in-game to export the result. The loop didn't close without the
deck.

## What ships

A **Report** control on the in-game HUD (`packages/app/src/rig-hud.ts`).
Tapping it builds the hand-back markdown from the shared verdict store and
the rig manifest — grouped by gate, one line per covered check with its
verdict and note — and offers **Copy** and **Download**, collapsed by
default. The report reads the exact same `localStorage` key
(`serfbound-gate-playtest-v1`) the HUD writes and the deck reads, so it is
the same data either surface would export.

The HUD is now a complete, self-sufficient protocol surface: open a rig
(`?rig=<id>`), do the one gesture, record the verdict, walk to the next
rig with **Next ›**, and at the end export the report — all inside the
game, on the device, with no second tab and no deck deployment. The deck
remains the richer launcher/dashboard when it is served same-origin.

## freeserf.net boundary

Held. The change is confined to the `?rig=`-gated HUD overlay (dev-only,
never mounted in normal play); no engine, asset, or player-surface code
changes. The report carries only verdict text the maintainer typed.

## Acceptance criteria

- [x] The HUD has a Report control that builds the hand-back markdown from
  the shared store, grouped by gate, with Copy and Download.
- [x] A verdict recorded in-game appears in the report and is persisted to
  the shared `localStorage` key — verified in real Chromium with real
  SPAU.PA.
- [x] Inert without `?rig=`; type-check, 323 unit tests, and the gate
  checks stay green.
