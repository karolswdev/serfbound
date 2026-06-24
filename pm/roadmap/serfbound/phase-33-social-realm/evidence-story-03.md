# Evidence — SB-33-03 — The Sign-In Moment

- **Shipped:** 2026-06-23
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` — adds the v2 sign-in moment to the Online panel:
  email, passkey, Google, Apple, Meta, explicit accountless copy, real email
  v2 readiness, and a separately labeled correspondence bridge.
- `packages/app/src/identity-v2-client.ts` — tiny browser client for v2
  password account creation and password sign-in.
- `packages/app/src/styles.css` — tokenized sign-in controls and focus states
  that live inside the existing Online panel instead of adding a nested card.
- `tests/browser/online-states.spec.ts` — covers method switching, live v2
  email readiness, the accountless sentence, and the legacy correspondence
  bridge.
- `pm/roadmap/serfbound/phase-33-social-realm/story-03-sign-in-moment.md`,
  `current-phase-status.md`, and top-level `README.md` — advance the PMO
  contract from SB-33-03 to SB-33-04.

## Acceptance criteria — re-checked

- [x] The Online panel exposes Email, Passkey, Google, Apple, and Meta as
  first-class sign-in choices.
- [x] Email creates a v2 password account or signs into the existing account
  through the configured identity service.
- [x] Provider and passkey states are designed but do not accept unverifiable
  tokens or pretend provider registration is complete.
- [x] The collected-data sentence remains in the Online panel.
- [x] Accountless play is explicit and remains ungated: no registration, no
  sign-in, no network for local play.
- [x] The Phase 25 correspondence key is labeled as a temporary bridge, not as a
  v2 credential.

## Verification

```text
npm run build
# passed

npm run build:web && npx playwright test tests/browser/online-states.spec.ts
# 1 passed

npx playwright test tests/browser/online-outage.spec.ts tests/browser/online-play.spec.ts tests/browser/gamification-gate.spec.ts tests/browser/community-maps.spec.ts
# 4 passed
```

Additional release checks run after the PMO files were updated:

```text
npm run test:unit
# tests 352
# pass 352

npm run check:boundaries
serfbound-boundaries-ok

npm run check:independence
serfbound-independence-ok: zero .NET artifacts in the tree.

npm run check:design
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.

npm run test:docs
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.

npm run check:links
serfbound-public-doc-links-ok: 16 local targets and 7 external URLs in README/CONTRIBUTING.
```

## Remaining Phase 33 work

SB-33-04 is next: define the social experience that opt-in identity unlocks.
SB-33-05 still owns the full opt-in journey gate: live provider handoff,
browser passkey ceremony, v2 migration standing, and the zero-network
accountless regression.
