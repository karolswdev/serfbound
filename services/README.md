# Serfbound services — operations

Two zero-dependency Node services back the optional online features.
The game never requires them: accountless, serverless play is
first-class forever, and clients re-verify every move themselves — the
services store and forward; they never referee.

## Running

```bash
node services/identity/server.mjs   # :4310, SERFBOUND_IDENTITY_PORT/STORE
node services/mailbox/server.mjs    # :4320, SERFBOUND_MAILBOX_PORT/STORE
```

Storage is one JSON file per service (set `*_STORE`); put them on a
persistent disk and back them up like any small file. Deployment is
the maintainer's activation step: any host with Node 22 works (a $5
VPS, a free-tier container, a Raspberry Pi). Put them behind HTTPS
(a reverse proxy) before announcing a public URL.

## What they hold (and don't)

- **Identity**: `accountId` (key fingerprint), `publicKeyJwk`, `name`,
  `createdAtIso` — nothing else, enforced by contract test (unexpected
  registration fields reject). No emails, no passwords, no sessions,
  no logs of play.
- **Mailbox**: challenges (terms + challenger key/name), matches
  (players' keys/names, the move list — world actions and checksums
  only, size-capped — deadlines, state, attestations, ratings).
  **Original game data cannot reach these services**: the wire format
  has no field for it.

## Abuse posture (honest limits)

- **Result forgery**: only dual-attested outcomes rate; the final
  checksum is the receipt (both full simulations agreed). One liar →
  `disputed`, quarantined unrated. Two colluding accounts can farm each
  other — modest stakes by design (no rewards, no decay); recorded,
  not defended.
- **Smurfing**: accounts are free keypairs; ratings are reputational
  only. Recorded, not defended.
- **Spam**: payload size caps and structural validation; no rate
  limiting yet — add a reverse-proxy limit when hosting publicly
  (recorded as the deployment checklist item).
- **Deadlines**: evaluated lazily on read — no server clocks, nothing
  to drift; a match nobody looks at forfeits the moment anyone looks.

## Recovery

Lost identity key = lost account (by design; the decision record).
Lost service storage file = lost ladder/open matches; finished games
live in players' local histories and their own match replays.
