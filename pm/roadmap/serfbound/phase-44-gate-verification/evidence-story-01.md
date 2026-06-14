# Evidence — SB-44-01 — The Protocol Deck

- **Shipped:** 2026-06-14
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files added

- `phase-44-gate-verification/playtest/index.html` — the self-contained
  reveal.js device-gate playtest deck (PROTOCOL data + slide rendering +
  verdict controls + offline fallback, all inline).
- `phase-44-gate-verification/playtest/verify-deck.mjs` — headless
  Chromium verification (the script below).
- `phase-44-gate-verification/playtest/artifacts/deck-phone.png` —
  title slide at a 414×896 phone viewport.

## Verification — `node …/playtest/verify-deck.mjs`

Real Chromium (Playwright 1.60), two passes: CDN reachable, then CDN
blocked to prove the offline fallback.

```
ok   - all 7 gate phases rendered (35,36,37,38,39,42,43)
ok   - 36 check slides rendered (expected 36)
ok   - 36 verdict control groups (one per check)
ok   - every check has Pass/Fail/Skip buttons
ok   - no console/page errors (0)
ok   - clicking Pass activates the verdict
ok   - progress chip updates after a verdict: "1/36 · ✓1 ✗0 ⤼0"
ok   - re-tapping clears the verdict: "0/36 · ✓0 ✗0 ⤼0"
    screenshot -> artifacts/deck-phone.png
ok   - offline fallback engages when the CDN is blocked
ok   - protocol still renders 36 checks with no CDN

ALL DECK ASSERTIONS PASS
```

`node …/verify-deck.mjs` → exit 0.

## Coverage map (check counts per gate)

| Phase | Gate | Checks |
|---|---|---|
| 35 | SB-35-04 | 4 |
| 36 | SB-36-06 | 3 |
| 37 | (visual confirmation) | 4 |
| 38 | SB-38-06 (alpha gate) | 9 |
| 39 | SB-39-05 | 5 |
| 42 | on-device maintainer gate | 6 |
| 43 | SB-43-05 (moderation + device) | 5 |
| **Total** | | **36** |

## Note

Each check's do/watch/pass text is taken from the corresponding phase's
`current-phase-status.md` exit criteria. The deck records verdicts in
memory only; persistence + a hand-back report are SB-44-02. The deck
does not certify any gate — only the maintainer's device pass does.
