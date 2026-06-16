# Evidence — SB-44-14 A PixelLab Asset Library and a Designed Protocol

## The asset library (PixelLab, committed to playtest/gumps/)

```
gate-35.png  walking serf      (locomotion)
gate-36.png  handcart          (transport economy)
gate-37.png  sapling           (living map)
gate-38.png  anvil + flame     (professions/tools/fire)
gate-39.png  crossed swords    (knight fidelity)
gate-42.png  quill             (map builder)
gate-43.png  scroll + globe    (community maps)
seal-pass.png / seal-fail.png / seal-skip.png   wax verdict seals
crest.png    castle-tower shield (title)
```

## Composed layout

`artifacts/deck-excellent.png` — check 36.1 on a phone: the carved card on a
dark vignette stage, the transport gate icon + `36.1` badge, the do/watch/pass
fields, the **▶ Open rig here** launch, the brass verdict buttons, and the
**green wax PASS seal stamped in the corner** when recorded. The title card
(captured earlier) carries the crest.

## Verified

```
stamp DOM check: {"verdict":"pass","stampDisplay":"block","stampBg":seal-pass}  WORKS
verify-deck.mjs: ALL DECK ASSERTIONS PASS (31 ok)
```

The restructure into cards required fixing `injectRig` to insert the rig
launch inside the card (the verdict box is now a grandchild of the slide) —
verify-deck's rig-button assertion confirms it.
