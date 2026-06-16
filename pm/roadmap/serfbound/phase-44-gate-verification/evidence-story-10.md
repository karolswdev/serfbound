# Evidence — SB-44-10 One Source of Truth

## Embedded vs standalone (real Chromium + real SPAU.PA)

```
ok - embedded game has NO in-game HUD (deck is the single source)
ok - standalone ?rig= still mounts the HUD
LINK OK
```

The deck opens the rig in its iframe; inside that frame the game boots the
rigged state but mounts no HUD. A direct `?rig=` in a fresh tab (not framed)
still mounts the HUD.

`artifacts/deck-link-clean.png` — the split: the deck (the protocol) on the
left, and on the right just the game (castle + the woods + road), no
duplicated instruction/verdict overlay.

## Single source on the slide (`verify-deck.mjs`)

```
ok - rig 'Open rig here' button injected on the check
ok - the rig panel does not repeat the check's instruction (single source)
ok - the check slide carries its own do/guidance
ALL DECK ASSERTIONS PASS (28 ok)
```

## No regressions

```
tsc -b packages/app → exit 0
verify-deck.mjs     → ALL DECK ASSERTIONS PASS
```

The deck still renders the protocol, captures verdicts, persists, exports
and submits the report, and the split-screen opens/closes — now with the
guidance and verdict in one place, and the deck driving the rig on slide
change.
