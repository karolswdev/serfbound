# Evidence — SB-44-20 Correctable Verdicts + Always-On Reset

## The bug

`setVerdict` auto-advanced whenever a verdict became set — including
re-deciding an already-recorded check. On a resumed run (every check
pre-filled), each tap changed the verdict then jumped to the next filled check,
so it read as "can't change dispositions / keeps recalling the old run."

Fix: capture the prior status and only advance on a fresh decision
(`if (cur.status && !prior && autoAdvance ...)`).

## Touch-context test (Playwright hasTouch + isMobile)

Seeded a resumed run (`{"35.1":{status:"pass"}}`), landed on 35.1, tapped Fail:

```
changed resumed verdict -> stays on 35.1 | fail now active: true
after reset-fab, progress: 0/36 · ✓0 ✗0 ⤼0
```

- Changing pass→fail on the resumed check stays on 35.1 (no jump); Fail is now
  the active verdict.
- The `↺ Reset` control clears the whole run from mid-deck.

## A fresh decision still walks forward

```
$ node .../verify-deck.mjs
ok   - recording a verdict auto-advances off 35.1 (now 35.2)
ALL DECK ASSERTIONS PASS
```
