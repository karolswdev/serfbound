# SB-44-12 — Playtest Fixes: Verdicts, a Road That Staffs, and a Debug Rig View

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-10/11 (the deck as single source + auto-advance)
- **Owner:** unassigned

## Problem

The maintainer's device run surfaced three real breakages:

1. **Couldn't record pass/fail.** The deck's verdict box used
   `class="controls"` — which collides with reveal.js's own `.controls`
   rule (`display:none`, and `visibility:hidden; position:absolute` on its
   buttons). Reveal hijacked every verdict box, so the Pass/Fail/Skip
   buttons were 0×0 and unreachable. The split-screen also collapsed the
   slide's layout in the narrow pane.
2. **The road test didn't work.** The road-split rig was castle → flag →
   road with nothing to carry. This engine staffs roads *lazily* (only on
   transport demand), so no carrier ever walked it — and the road was a
   2-tile stub with no real middle to split.
3. **No debug tools.** The embedded game showed the full player chrome
   (import-data panel, identity, social) instead of a focused rig view.

## What ships

- **Verdicts reachable.** The verdict box is renamed `.controls` →
  `.verdict-set` (and the notes textarea kept — `aside.notes` in reveal
  doesn't match a `<textarea>`), ending the reveal collision. In split mode
  the current slide is laid out as a normal scrollable column (reveal's
  scaled absolute layout collapses in a 50vw pane), so the check and its
  Pass/Fail/Skip are always sized and tappable. A verify-deck guard asserts
  the buttons aren't `position:absolute`.
- **A road that staffs.** The road-split rig now lays a long, straight
  8-tile road (`RigBuilder.flagInLine`) from the castle to a lumberjack's
  hut. The hut's construction demands materials, so the road actually
  staffs — a carrier walks it — and there's a clear middle to split. A
  `tree`-free demand fix that generalises: a rig that needs serf movement
  needs a consumer.
- **A debug rig view.** When the game runs embedded in the deck
  (`window.self !== window.top`), it enters rig/dev chrome: the
  under-the-hood ledger (the debug tools — build controls + state readout)
  opens, and the player-facing panels (import, identity, network) hide, so
  the pane is the rig plus its instruments.

## freeserf.net boundary

Held. Engine untouched; rig authoring + deck tooling + one `?rig=`-gated app
flag and tokenless declutter CSS.

## Acceptance criteria

- [x] In split mode the verdict button is visible, sized, and a real click
  records the verdict (`deck-split-usable.png`); verify-deck guards the
  rename (31 ok).
- [x] The road-split rig lays an 8-tile road and a carrier staffs it (serfs
  spawn by ~1500 ticks headless; the carrier renders in `rig-debug-view.png`).
- [x] An embedded rig hides the import panel and opens the dev ledger
  (`rig-debug-view.png`; browser-asserted).
- [x] 329 unit tests, verify-rigs, and all gate checks green.
