# Evidence — SB-44-11 Auto-Advance

## verify-deck.mjs

```
ok - navigated to the check slide: 35.1
ok - recording a verdict auto-advances off 35.1 (now 35.2)
ALL DECK ASSERTIONS PASS (30 ok)
```

A Pass recorded on the 35.1 slide steps the deck to 35.2 after the beat. In
split mode the resulting `slidechanged` loads 35.2's rig on the right
(SB-44-10), so the walk-through is hands-free.

The existing assertions confirm the rest is unchanged: clearing a verdict
toggles (and cancels the pending step via `clearTimeout`), persistence, the
report, the split-screen, and the single-source guidance all still pass.

## Toggle

A remembered checkbox in the pre-flight ("Auto-advance to the next check
after a verdict", default on, persisted to `serfbound-auto-advance`) turns
it off for manual stepping.
