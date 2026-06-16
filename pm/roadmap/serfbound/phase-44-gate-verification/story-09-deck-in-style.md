# SB-44-09 — The Protocol Deck, In Style

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-08 (the forged HUD + the button gump), SB-44-05 (the hosted deck)
- **Unblocks:** a protocol that reads as one product — deck and game in the same skin
- **Owner:** unassigned

## Problem

SB-44-08 forged the in-game results window in the shell's materials. That
left the reveal.js deck — the protocol itself — looking like a different
product: flat dark theme, generic pills, a system font, next to a game and
a HUD built from carved gumps, parchment, and gold. The maintainer asked
for the deck to be made professional and in-style too.

## What ships

The deck (`playtest/index.html`) now wears the same skin as the game and
the HUD:

- **Materials.** Wood-under-ink background (`wood.png` under an ink veil),
  the carved frame gump (`frame.png`) on the rig-launch and warn panels,
  and the brass-cornered button gump (`button.png`) on every control —
  verdicts, "Open rig here", and the Results actions (Copy / Download /
  Reset / Submit). Verdict accents name the result on the plate (Pass →
  meadow, Fail → banner-red, Skip → gold-deep).
- **Voice.** The Inter stack, parchment body, gold headings and labels,
  moss for muted copy — the `tokens.css` palette, mirrored into the deck's
  own `:root` (the deck is standalone tooling, so it carries its own copy).
- **Shipping the chrome.** The gumps travel with the deck
  (`playtest/gumps/`), and the publish plugin (`vite.config.ts`) copies
  them into `dist/playtest/gumps/` so the hosted deck and a local
  `file://` open both render the materials. `image-rendering: pixelated`
  throughout; a gump that fails to load degrades to the token surfaces.

## freeserf.net boundary

Held. The gumps are the same first-party art the shell uses (SB-32-07 /
SB-44-08); no original game data. The deck is roadmap tooling — no engine,
asset, or player-runtime code changes.

## Acceptance criteria

- [x] The deck renders in the Serfbound skin — wood/ink background, carved
  panels, parchment/gold voice, gump buttons (`artifacts/deck-skin-check.png`).
- [x] The gumps ship with the deck (`playtest/gumps/` committed; the
  publish plugin copies them to `dist/playtest/gumps/`, verified in the
  build output).
- [x] All deck behaviour intact (`verify-deck.mjs`, ALL DECK ASSERTIONS PASS).
