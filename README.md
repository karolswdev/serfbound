# Serfbound

A faithful, pure-browser remake of **The Settlers I / Serf City: Life is
Feudal** (Blue Byte, 1993) — TypeScript, WebGL2, and WebAudio, with no
servers required to play. Import your own original game data file
(`SPAU.PA`) and the complete classic game runs in your browser: the
original world generator, every production chain, knights and conquest,
the original interface decoded from your data, sound and music, the
31-mission campaign, classic AI opponents, DOS savegame import — plus
browser-native extras the original never had: an installable offline
PWA, touch play with gestures, native-resolution view scales, realtime
two-player lockstep, and correspondence ("offline chess") matches.

**Your game data never leaves your machine.** Serfbound contains no
original assets and never uploads, hosts, bundles, or caches them; the
data you import lives only in your browser's local storage.

## Play

1. Build and open the app (see Development), or use the published Pages
   site.
2. Import your `SPAU.PA` (from your own copy of the game — the demo
   version's file works).
3. START. The [player guide](docs/player-guide.md) covers everything:
   controls, keyboard/touch play, saves, sound, offline play, and the
   two-player modes. Tip: `?seed=` in the URL (16 digits, 1–8) pins the
   world.

## Development

Node version per `.nvmrc`.

```bash
npm install
npm test                 # unit + browser e2e (data-free)
npm run ci:release       # the full release gate set
npm run build:web        # static artifact in dist/
```

The [developer guide](docs/developer-guide.md) covers the package
boundaries, the opt-in real-data tests, and the delivery process. This
project is delivered through the PMO roadmap at
[`pm/roadmap/serfbound/`](pm/roadmap/serfbound/) — every shipped story
carries evidence. Contributors: enable the contract hook with
`git config core.hooksPath .githooks`. (Heavy visual-evidence artifacts
from earlier phases remain in the archive repository noted below.)

## Lineage and license

Serfbound is **GPL-3.0** (see [LICENSE](LICENSE)). It is a
browser-native reimplementation derived from the behavior of
[freeserf.net](https://github.com/Pyrdacor/freeserf.net) (C#), itself
derived from [freeserf](https://github.com/freeserf/freeserf) (C) —
the exact game rules, tables, formats, and layouts were ported from
those GPL projects against real-data and fixture parity tests, and the
code cites the upstream files it preserves. Serfbound's own development
history before this repository lives in the archive at
[karolswdev/freeserf.net](https://github.com/karolswdev/freeserf.net).

The Settlers is a trademark of its respective owners. This project is
an unaffiliated preservation effort; it requires data files from a copy
of the original game.
