# Evidence — SB-44-02 — Feedback Capture and Export

- **Shipped:** 2026-06-14
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `phase-44-gate-verification/playtest/index.html` — capture layer added
  to the deck: `localStorage` persistence (the `onVerdictChange` seam now
  saves), `restore()` on load with a resume banner, a Results slide that
  builds a markdown report with Copy / Download, and `resetAll()`.
- `phase-44-gate-verification/playtest/verify-deck.mjs` — pass 3 added
  (persistence + report + reset).

## Verification — `node …/playtest/verify-deck.mjs`

Full run (passes 1–3) in real Chromium, exit 0:

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
ok   - verdict persists across reload (localStorage)
ok   - note persists across reload: "clean walk"
ok   - resume banner shows after a restore
ok   - report records the verdict
ok   - report carries the note
ok   - report groups by phase with a roll-up verdict
ok   - reset clears all verdicts
ok   - reset clears persisted storage

ALL DECK ASSERTIONS PASS
```

## Report shape

`buildReport()` emits, per phase, a header with the gate id, a roll-up
verdict (`ALL PASS — ready to close` / `N FAILED — loops` / `passes with
N skipped` / `incomplete`), then each check with its status icon, the
pass criterion, and any note. That markdown is what the maintainer hands
back; each closing gate's `evidence-story-*.md` gets authored from it.

## Note

Persistence is keyed `serfbound-gate-playtest-v1` and wrapped in
try/catch, so a storage-disabled context degrades to in-memory rather
than erroring. The capture layer is pure local JS — no network, no
product runtime, not a player-facing path.
