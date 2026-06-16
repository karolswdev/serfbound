# SB-44-08 — A Vertical Split and a Forged Results Window

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-07 (the split-screen), SB-44-03 (the in-game HUD)
- **Unblocks:** a protocol that reads as part of the game, not a dev widget over it
- **Owner:** unassigned

## Problem

Two finishes the maintainer asked for after using the split-screen:

1. **Split the wrong way.** The window split horizontally (deck over game);
   he wanted it **vertical** — deck and game side by side, two columns.
2. **The results window looked nothing like Serfbound.** The in-game HUD
   was a generic dark widget floating over a game built from carved-frame
   gumps, parchment, and gold. It had to wear the shell's own materials —
   gumps, the `--sb-font`, and buttons that read as Settlers buttons. (And
   PixelLab is right there for the art.)

## What ships

- **Vertical split.** The deck and the rig panel sit as two columns —
  deck left, game right — so a check is read on one side and played on the
  other.
- **The results window, forged.** The in-game HUD now wears the design
  system (`packages/app/src/styles.css` `.rig-hud*`): the carved frame gump
  (`frame.png`, 9-slice) over wood-under-ink (`wood.png` + `--sb-ink-veil`),
  parchment/moss/gold voice in `--sb-font`, and a **new button gump**
  (`gumps/button.png`, commissioned from PixelLab per §8 — a brass-cornered
  plate, 9-sliced) for every control. Verdict accents name the result on
  the plate (Pass → `--sb-meadow`, Fail → `--sb-banner-red`, Skip →
  `--sb-gold-deep`). All styling moved from inline to tokenized CSS, so it
  answers to the design standard — `image-rendering: pixelated`, text on the
  solid ink veil, a flat-CSS fallback if a gump fails to load (§7.5).

## freeserf.net boundary

Held. `button.png` is generated first-party art (PixelLab), kin to the
shell's palette and chunky-pixel idiom, committed as ours — never an
imitation of original sprites (design standard §8). No original game data.

## Acceptance criteria

- [x] The protocol splits vertically (deck left, game right); opening a rig
  splits, closing un-splits (`verify-deck.mjs`, ALL DECK ASSERTIONS PASS).
- [x] The HUD wears the gumps/font/buttons and conforms to the design
  standard — `check:design` green, raw-color ratchet 0/0, the
  `button.png`/`frame.png`/`wood.png` references all resolve.
- [x] The HUD's test hooks and behaviour are unchanged: it mounts, records,
  and reaches Running in real Chromium (`verify-rigs` browser pass).
- [x] Visual proof: `artifacts/rig-hud-gump.png` (the forged HUD) and
  `artifacts/deck-vertical-split.png` (deck-left / game-right).
