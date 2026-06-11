# Evidence — SB-32-04 — Competitive Surfaces Styled as a Platform

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` — the sign-in explainer (the device-key
  model and what the service can never do, in the product voice), the
  lobby rendered as challenge cards (who, on what terms, one action)
  with the designed quiet-lobby state, the match strip (the whole
  correspondence at a glance: your window / opponent moved / recap /
  the closing ceremony with victory, defeat, forfeit, and disputed
  treatments), the "Seal the result" label over the attest pair, the
  your-turn badge's single arrival pulse, and the Chronicle row
  (match history presented, not just counted).
- `packages/app/src/styles.css` — lobby card, quiet-lobby, match
  strip with mode accents (meadow for your turn, banner-red for
  failure), the badge pulse keyframes (silenced by reduced motion via
  the duration tokens).
- `tests/browser/online-states.spec.ts` — additive spec against real
  spawned services: the explainer, the chronicle, the quiet lobby,
  and the challenge card's name/terms/action.

## Verification artifacts

```
serfbound-design-tokens-ok: 43 defined, 43 consumed, 0 reserved,
  ratchet 0/0.
online-states + online-play + online-outage: 3 passed (24.4s)
  (the full two-device match flows through the new cards unchanged)
npm run ci:release -> exit=0 (captured directly)
```

Real-data captures (local `SPAU.PA`, two contexts against local
service instances) under `artifacts/`:
`story-04-quiet-lobby.png`, `story-04-lobby-card.png`,
`story-04-your-turn-strip.png`, `story-04-ceremony-victory.png`.

## Acceptance criteria — re-checked

- [x] Every online state is designed — signed-out/in (Account row),
  unavailable (SB-29's recoverable detail, restyled in 32-02), the
  quiet lobby, populated cards, the six in-match strip lines, and
  the four ceremony outcomes; no raw-text fallback remains.
- [x] The sign-in moment presents the device-key model and the
  privacy posture — "a key born on this device — no email, no
  password, nothing to leak"; asserted in online-states.spec.
- [x] online-play and online-outage green unchanged; the added
  state-coverage spec passes; captures committed.

## Deviations from plan

- Profile/history presentation landed as the Chronicle row
  (count-as-prose) — the full match-history view remains Phase 30
  scope (SB-30-02), as the story's Out already said.
- The hot-seat/async/realtime grouping shipped in SB-32-02
  ("Play with someone"); this story added the Chronicle to it.

## Follow-ups

- SB-32-05: the gate — full-journey before/after, conformance pass,
  serfbound.com redeploy, the maintainer's verdict.
- SB-30-01's ladder view inherits `.lobby-card` and the match-strip
  idiom directly.
