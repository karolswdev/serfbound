# Evidence — SB-32-02 — Shell Chrome Rebuilt to the Standard

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/styles.css` — full rewrite to the standard: every
  color and size is a token (raw-color ratchet 15 → **0**), the
  designed header (emblem + brand block), panel groups with kicker
  titles on raised surfaces, the control system from SB-32-01, and
  the three chrome-state compositions.
- `packages/app/src/main.ts` — the shell template restructured into
  purposeful groups (Your data / The realm / The ledger / Play with
  someone / Online / Housekeeping) with every testid preserved
  verbatim; `data-serfbound-chrome` derived by a MutationObserver on
  game/data state (pre-import → title → running).
- `packages/app/src/tokens.css` — five tokens added (veils, soft
  line, canvas well, meadow veil) so component CSS holds zero
  literals.
- `public/emblem.png` — the Serfbound emblem, first-party pixel art
  generated via PixelLab (raw MCP-over-HTTP; object
  db9a4893-94fc-49cc-99b9-86bbc2e69746), 64×64, per standard §8.
- `scripts/check-design-tokens.mjs` — reserved list shrunk 19 → 2
  (only SB-32-03/04 tokens remain); ratchet pinned at 0.
- `tests/browser/chrome-states.spec.ts` — the three compositions
  asserted: pre-import banner, title accent, running shrinks the
  wordmark below 24px and hides the kicker while every control stays
  reachable.

## Verification artifacts

```
serfbound-design-tokens-ok: 43 tokens defined, 41 consumed,
  2 reserved, raw-color ratchet 0/0.
chrome-states.spec: 1 passed
npm run ci:release -> exit 0 on the rebuilt chrome
  (unit 234/234, all browser suites incl. online-play/outage,
   boundaries, independence, check:design, static hosting, docs)
```

The full suite passing **unchanged** is the compatibility-contract
proof: zero test edits beyond the new additive spec. (The spec's
first draft wrongly expected build buttons enabled on game start —
they enable on tile selection; the spec was corrected, not the app.)

Real-data captures (local `SPAU.PA`, desktop 1440×900 + phone
390×844) under `artifacts/`:
`story-02-{pre-import,title,running}-{desktop,mobile}.png`.

## Acceptance criteria — re-checked

- [x] Every visible shell element traces to a standard component —
  panel groups, rows, controls, pill, badge; the token lint enforces
  the zero-literal rule mechanically.
- [x] The three chrome states are visibly distinct; running yields to
  the game (kicker gone, wordmark to text-lg, emblem to 28px, panel
  density tightened) — chrome-states.spec + captures.
- [x] `ci:release` green with zero test edits beyond the additive
  spec; Phase 8 a11y positions ran green inside the suite.
- [x] Desktop + phone captures from real local data committed.

## Deviations from plan

- The "Online" group's value row is labeled "Account" (the group
  title carries "Online") — voice rule: labels are nouns.
- pixellab was reached over raw MCP-over-HTTP (curl JSON-RPC) since
  the registered server only loads on fresh sessions — same API,
  same auth, recorded here for the runbook.
- The landing-hero deferred decision stands resolved-by-restraint:
  the emblem + composition carry the brand; no asset-heavy hero.

## Follow-ups

- SB-32-03 owns the onboarding copy (kept verbatim this story) and
  the import journey states (`--sb-banner-red` reserved for it).
- SB-32-04 owns lobby cards/toasts (`--sb-shadow-card` reserved).
- serfbound.com re-deploy with the new chrome lands with the
  SB-32-05 gate.
