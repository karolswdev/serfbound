# Evidence — SB-44-05 Host the Protocol Deck

## What was verified

`build:web` publishes the deck into the deploy artifact at `/playtest/`,
self-contained.

```
npm run build:web   → exit 0
ls dist/playtest/
  index.html        (27 KB, the gate-verification deck)
```

The deck has no local asset dependencies (reveal.js from CDN, inline
styles/scripts), so the single copied `index.html` is the whole page.

Served same-origin with the game, the deck's existing behaviour is
unchanged — the SB-44-03 deck assertions (rig deep-link injection, the
shared-store reflection, the report) continue to pass
(`verify-deck.mjs`, ALL DECK ASSERTIONS PASS).
