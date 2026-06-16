# Evidence — SB-44-09 The Protocol Deck, In Style

## Visual

`artifacts/deck-skin-check.png` — a check slide on a phone viewport:
wood-under-ink background, "CHECK 35.1" and labels in gold, parchment body
copy in the Inter stack, the rig-launch panel framed by the carved
`frame.png` gump with an "▶ Open rig here" button gump, and the verdict
buttons as brass-cornered `button.png` plates (Pass active in meadow). The
deck now matches the in-game HUD (SB-44-08).

## The gumps ship with the deck

```
npm run build:web
  → dist/playtest/gumps/  button.png frame.png ribbon.png wood.png
```

The publish plugin (`vite.config.ts`) copies `playtest/gumps/` into the
build output, so the hosted deck at `serfbound.com/playtest/` renders the
materials; the gumps are also committed beside the deck for `file://`.

## Behaviour intact

```
verify-deck.mjs → ALL DECK ASSERTIONS PASS (27 ok)
```

The restyle is presentational: the protocol render, verdict capture,
persistence, rig deep-links, the split-screen, the report export, and the
server submit all still pass.
