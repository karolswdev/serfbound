# SB-44-14 — A PixelLab Asset Library and a Designed Protocol

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-09 (the deck skin), SB-44-13 (mobile sizing)
- **Owner:** unassigned

## Problem

Even skinned, the deck read like a tech demo: check text floated in a dark
void over a patchy wood tile, with no composition, no framing, and nothing
to tell one kind of test from another at a glance. The maintainer asked for
it to look cool and Serfbound, with a proper **asset library** — art per
test type — so the protocol is both beautiful and efficient to scan.

## What ships

A first-party **PixelLab asset library** (commissioned, committed, in the
shell's palette — design standard §8) and a composed layout built on it:

- **A gate icon per test type** — `gate-35`..`gate-43`: a walking serf
  (locomotion), a handcart (transport), a sapling (living map), an
  anvil+flame (professions), crossed swords (knights), a quill (map
  builder), a scroll+globe (community). Each phase and check card wears its
  gate's icon, so you know the kind of test at a glance.
- **Wax verdict seals** — `seal-pass/fail/skip`: recording a verdict
  **stamps** the matching wax seal onto the card (rotated, in the corner) —
  a satisfying, scannable record of the answer.
- **A settlement crest** on the title.
- **Carved cards.** The check, phase, and title content now sit in a
  framed parchment-on-wood card (`frame.png` 9-slice) on a clean dark
  vignette stage — composed, not floating. Top-aligned (`center:false`),
  reveal's progress-bar artifact removed, fade transition.

All assets live in `playtest/gumps/` and ship with the deck (the vite
publish plugin copies them to `dist/playtest/gumps/`).

## freeserf.net boundary

Held. The art is first-party generated (PixelLab), kin to the shell palette
and chunky-pixel idiom, committed as ours — never an imitation of original
sprites (§8). The deck is roadmap tooling; no engine/app change.

## Acceptance criteria

- [x] Each gate (35–39, 42, 43) has a distinct pixel-art icon shown on its
  phase and check cards.
- [x] Recording a verdict stamps the matching wax seal on the card
  (`deck-excellent.png`; DOM-verified the stamp shows on `data-verdict`).
- [x] The title carries the crest; content is framed in cards on a clean
  stage (`deck-excellent.png`).
- [x] All deck behaviour intact (`verify-deck.mjs`, 31 ok).
