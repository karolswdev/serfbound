# Evidence — SB-33-04 — The Social Experience, Defined

- **Shipped:** 2026-06-23
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `pm/roadmap/serfbound/adoption/social-experience-definition.md` — accepted
  planning boundary for the opt-in social realm: friends, guild rosters,
  presence, social hub, data posture, product flows, candidate Phases 45-48,
  explicit non-goals, and stop signals.
- `tests/ci/social-experience-definition.test.mjs` — CI guard that preserves
  the unbreakables, social pillars, forbidden data list, and later-phase scope.
- `pm/roadmap/serfbound/phase-33-social-realm/story-04-social-experience-definition.md`
  — marks the story done with concrete acceptance criteria and test plan.
- `pm/roadmap/serfbound/phase-33-social-realm/current-phase-status.md` — marks
  SB-33-04 done and names SB-33-05 as next.
- `pm/roadmap/serfbound/README.md` — adds the definition to source canon and
  updates the Phase 33 summary.

## Acceptance criteria — re-checked

- [x] The social-experience definition exists as canon and is linked from the
  roadmap source canon.
- [x] Friends, real guild rosters, presence, and the social hub are defined as
  opt-in social pillars.
- [x] The two unbreakables hold: accountless play remains first-class, and
  collected social data is named plainly.
- [x] Candidate Phases 45-48 are scoped without implementing social feature
  code in Phase 33.
- [x] The data posture forbids original game data, raw archives, local saves,
  provider tokens, credential secrets, device keys as v2 credentials, address
  books, analytics/tracking ids, browser fingerprints, and exact presence
  history.
- [x] A CI test guards the record against silent drift.

## Verification

```text
node --test tests/ci/social-experience-definition.test.mjs
# tests 4
# pass 4

npm run test:unit
# tests 356
# pass 356

npm run test:docs
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.

npm run check:links
serfbound-public-doc-links-ok: 16 local targets and 7 external URLs in README/CONTRIBUTING.

npm run check:boundaries
serfbound-boundaries-ok

npm run check:independence
serfbound-independence-ok: zero .NET artifacts in the tree.

npm run check:design
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.
```

## Remaining Phase 33 work

SB-33-05 is next: the social identity gate. It must prove the full opt-in
journey end to end and the accountless regression: zero walls, zero feature
loss, zero network.
