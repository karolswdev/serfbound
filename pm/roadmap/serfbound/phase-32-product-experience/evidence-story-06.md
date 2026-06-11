# Evidence — SB-32-06 — The Product Cut

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `docs/design/design-standard.md` — the two missing laws entered §4
  first (*no diagnostics on the player surface*; *one surface, one
  moment*) and the dev ledger entered §3.
- `packages/app/src/main.ts` — Source/Map/Hover/Selected-Tile/Action
  rows and the build/error-report dev controls moved into the
  collapsed `dev-ledger` disclosure; the realm group reduced to the
  Game row + START; view-scale joined Housekeeping; `?dev=1` opens
  the ledger and restores all groups in all states.
- `packages/app/src/styles.css` — the ledger component, chrome-state
  group gating (pre-import hides realm/saves; running hides the
  start surface), the title-state START hero.
- `tests/browser/chrome-states.spec.ts` — extended: running hides
  START and the build controls, diagnostics hidden, the ledger
  present and closed.
- `tests/browser/{static-shell,decoded-scene,high-dpi}.spec.ts` —
  goto URLs gained `dev=1` (the recorded contract evolution: these
  three suites drive dev controls; the surface they test moved, it
  did not shrink).

## Verification artifacts

```
affected specs (chrome-states, first-run, static-shell,
  decoded-scene, high-dpi, identity-customization): 13 passed
npm run ci:release -> exit=0
npm run test:compatibility -> exit=0 (5/5 positions; the keyboard
  contract holds — first Tab still lands on the Import control)
serfbound-design-tokens-ok: 43/43, 0 reserved, ratchet 0/0
```

Captures refreshed with real local `SPAU.PA` (desktop + phone, all
three states + the first-run journey) — the player surface now shows:
pre-import → welcome + your data + identity + online; title → START
as the hero; running → the game, session controls, and a closed
"Under the hood" at the chrome's foot.

## Acceptance criteria — re-checked

- [x] No diagnostic row or dev control on the default player surface
  in any chrome state — chrome-states.spec asserts hidden pointer
  state, hidden build controls, closed ledger.
- [x] Pre-import / title / running each show their moment —
  spec-asserted and captured.
- [x] Full suite green: product specs on the player surface, the
  three dev suites via `?dev=1`, compatibility 5/5.

## Deviations from plan

- The Game state row stayed on the player surface (realm group,
  title state) — it is product status ("Running", "Data needed"),
  not a diagnostic; the line is drawn in the standard's §4 wording.
- The onboarding banner remains in the data group pre-import
  (test-asserted visible there, and it is player guidance, not a
  diagnostic).

## Follow-ups

- SB-32-05 re-presents the gate to the maintainer on this surface —
  their eyes close the phase or produce the next punch list.
- serfbound.com redeploy carries the cut (dispatched with this
  commit).
