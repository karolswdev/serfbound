# Evidence — SB-29-04 — Online Surface and Hosting Gate

- **Shipped:** 2026-06-11
- **Commit:** 896dd12 (implementation) + this commit (public proofs + flip)
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/online-config.ts` — endpoint resolution: explicit
  test params → `?api=` base → persisted base → `https://api.serfbound.com`.
- `packages/app/src/online-surface.ts` — DOM-free sign-in / lobby /
  your-turn controller; service-sanitized names; every failure
  degrades to a recoverable "unavailable", never a throw.
- `packages/app/src/online-match.ts` — online correspondence: the
  Phase 23 window flow with the mailbox as transport; signed posts,
  polled arrivals, recap re-verification, dual-attestation finish.
- `packages/app/src/main.ts` — the Online panel (sign-in, refresh,
  post challenge, lobby, your-turn badge, attest buttons), the
  timer-loop branch, Enter-pickup, account restore from the profile,
  challenge-accepted auto-start, 2s/6s polling (zero traffic while
  signed out).
- `packages/app/src/profile-store.ts` — history mode union gains
  `"online"`.
- `tests/ci/online-{config,surface,match}.test.mjs` — 9 new unit
  tests against real in-process services.
- `tests/browser/online-play.spec.ts` — the gate e2e: two isolated
  contexts, spawned real services, full match to dual attestation.
- `tests/browser/online-outage.spec.ts` — the outage regression.

## Verification artifacts

**CI-safe proofs** (run locally; pushed CI green on 896dd12):

```
unit: # tests 234 / # pass 234 / # fail 0    (225 -> 234)
browser: 16 specs in 11 files, all green, including:
  online-play: two devices play an online match to dual attestation (24.1s)
  online-outage: a dead online service costs accountless play nothing (532ms)
npm run ci:release -> exit 0 (unit, browser, boundaries, independence,
  static hosting, docs)
```

**The public-backbone match** (manual evidence run, the committed
e2e re-pointed at `https://api.serfbound.com`):

```
PUBLIC RUN agreed boundary checksum: 1088464342
PUBLIC RUN complete: dual attestation through https://api.serfbound.com
1 passed (23.9s)

ladder after the match (production service):
ALICE rating 1516, BOB rating 1484 — Elo K=32 on the dual-attested result
```

Production stores wiped pristine afterwards (`{"ladder":[]}`, no
accounts) — test residue does not greet the first real player.

**serfbound.com serves the game**:

```
DNS apex -> GitHub Pages (185.199.108-111.153), Cloudflare DNS-only
certificate: CN=serfbound.com (issued after re-kicking the Pages
  custom domain once DNS existed)
http://serfbound.com -> 301 -> https://serfbound.com/ -> 200
https_enforced: true

landing check from the production page:
  title: Serfbound
  online-state before refresh: Signed out
  online-status after refresh: signed-out, lobby-count: 0
  (a SUCCESSFUL round-trip to api.serfbound.com from serfbound.com —
   failure would read "Online unavailable")
```

**Screenshots** under `artifacts/`: `story-04-public-lobby.png`,
`story-04-public-your-turn.png`, `story-04-public-match-ended.png`,
`story-04-serfbound-com-landing.png`.

## Acceptance criteria — re-checked

- [x] `serfbound.com` loads the playable game — landing check +
  screenshot; HTTPS enforced with its own certificate.
- [x] The shell surface completes a real two-browser correspondence
  match through `https://api.serfbound.com` with agreeing checksums —
  the public run above (boundary 1088464342 on both sides), plus the
  same flow CI-proven in `online-play.spec.ts` every run.
- [x] With the API blocked, import/play/save pass unchanged and the
  online UI reports unavailability recoverably — `online-outage.spec.ts`,
  green in CI.
- [x] Accountless play remains the default path — no sign-in gates any
  existing flow; signed-out players generate zero network traffic
  (polling is gated on signed-in status; the outage spec runs the
  whole local loop without one online call succeeding).

## Deviations from plan

- The Phase 25 named gap listed "sign-in, lobby, your-turn badge,
  ladder view". The first three ship here; the **ladder view** was
  scoped to Phase 30 (SB-30-01) when these phases were scaffolded —
  the gap's service-deployment blocker is fully closed, the remaining
  ladder surface is tracked work, not a gap.
- Match end is dual attestation by declaration (attest win/loss over
  the shared verified boundary checksum) — no engine or service
  change; disagreement quarantines as disputed, the Phase 25 model.
- Online matches don't yet resume after a reload, and auto-start
  handles one fresh match at a time — multi-match management belongs
  with Phase 30's surfaces (recorded follow-up).
- Pages certificate provisioning stalled because the custom domain
  was registered before DNS existed; clearing and re-setting the
  cname re-triggered issuance (minutes). Recorded for the runbook.

## Follow-ups

- SB-30-01 (ladder/leaderboard view) is unblocked — the deployed URL
  it needs now exists.
- Online match resume-after-reload — Phase 30 or 27 territory.
- Phase 27's signaling relay joins `deploy/` when it ships.
