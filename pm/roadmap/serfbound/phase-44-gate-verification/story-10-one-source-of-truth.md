# SB-44-10 — One Source of Truth: the Deck Guides, the Game Is the Rig

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-07 (split-screen), SB-44-08 (the in-game HUD), SB-44-09 (the styled deck)
- **Unblocks:** a protocol that reads once — guidance and verdict live in the deck only
- **Owner:** unassigned

## Problem

With the split-screen open, the same information appeared three times: the
check slide's do/watch/pass on the left, the rig panel repeating the
instruction/result, and the in-game HUD repeating instruction + result +
its own Pass/Fail/Skip on the right. Two places to set a verdict, three to
read the instruction. The maintainer asked for the deck to *guide* and to
be the **one** place pass/fail is set — read out of a single source.

## What ships

The reveal.js deck is now the single source of truth; the game on the
right is just the rig.

- **The in-game HUD is suppressed when embedded.** When the game runs in
  the deck's iframe (`window.self !== window.top`), `loadRig`
  (`packages/app/src/main.ts`) boots the rigged state but does **not**
  mount the HUD — no duplicated instruction or verdict controls. A
  standalone `?rig=` (no deck) still mounts the HUD, so direct access keeps
  its guidance.
- **The rig panel is just the launch.** The deck no longer repeats the
  rig's instruction/result under the button — the check slide's own
  do/watch/pass is the one guidance, and its Pass/Fail/Skip + notes are the
  one verdict.
- **The deck drives the rig.** Once the split is open, stepping to another
  check slide swaps the game on the right to that check's rig
  (reveal `slidechanged` → `openRigInFrame`). You walk the protocol on the
  left; the right follows.

## freeserf.net boundary

Held. Tooling + a one-branch guard in the `?rig=` app seam (suppress the
HUD when framed); no engine, asset, or player-runtime change.

## Acceptance criteria

- [x] Embedded (deck iframe): the game mounts no in-game HUD; standalone
  `?rig=` still does (browser-verified, `deck-link-clean.png`).
- [x] The rig panel does not repeat the check's instruction/result — the
  slide carries its own do/guidance (`verify-deck.mjs`: "single source").
- [x] Stepping the deck in split mode swaps the rig on the right.
- [x] All deck behaviour intact (`verify-deck.mjs`, ALL DECK ASSERTIONS PASS).
