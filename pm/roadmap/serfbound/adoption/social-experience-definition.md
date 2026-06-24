# Social Experience Definition

**Status:** accepted planning boundary for Phase 33.
**Story:** SB-33-04.
**Decision record:** `social-identity-decision.md`.
**Authority:** maintainer-directed Phase 33 execution. This record scopes what
opt-in identity unlocks; it does not authorize feature code before the named
later phases.

## Product Thesis

Serfbound's social realm is the place where opt-in players recognize each
other, organize, and start games together. It grows from the systems already in
the product: profiles, avatars, guild heraldry, the ladder, deeds, community
maps, and correspondence play.

The social realm is not a feed, an analytics surface, or a replacement for the
classic game. Accountless play remains first-class: no registration, no
sign-in, no network, no prompt loop, and no feature loss for local single-player
or local custom maps.

## Social Pillars

### Friends

Friends are explicit account-to-account relationships between v2 accounts.
They exist to make direct play easier:

- Send, accept, decline, and cancel friend requests.
- Start direct correspondence challenges from a friend row.
- See a friend's public name, avatar, guild badge, ladder rating, and deed
  summary when those surfaces already exist.
- Block or mute an account without explaining why.

Friends do not import contacts, scan address books, recommend strangers from
behavior, or expose accountless players. A player who never signs in has no
server-side friend record.

### Real Guild Rosters

The current local guild choice becomes the visual language for real guilds, not
a gameplay advantage. A guild is an opt-in roster with identity and ceremony:

- Guild name, heraldry, short public motto, and member list.
- Roles: founder, officer, member.
- Invite, accept, leave, remove, and transfer founder.
- Guild-facing challenge and community-map entry points.
- Member rows show public profile information already allowed elsewhere.

Guilds never change the simulation, economy, starting goods, combat odds, map
visibility, or ladder scoring. The roster is social coordination only.

### Presence

Presence is coarse, TTL-based, and opt-in with sign-in:

- Online, away, in match, editing a map, browsing maps.
- Last-seen time rounded to a player-friendly window.
- Presence expires unless refreshed by an active signed-in session.
- A player may hide presence from everyone, or from non-friends.

Presence never stores exact cursor position, exact map tile, imported data
identity, browser fingerprint, continuous idle telemetry, or a full session
timeline.

### Social Hub

The hub is the signed-in player's operational home, not a marketing page and not
the first screen for accountless players. It brings together:

- Friends and pending invites.
- Guild roster and guild actions.
- Direct challenges and current correspondence matches.
- Community maps from friends/guilds.
- Ladder standing, chronicle summary, and deeds.

The hub does not auto-play media, rank engagement, infinite-scroll posts, or
sell attention. It is a compact play surface: who is around, what can I play,
what happened while I was gone.

## Data Posture

The v2 identity schema remains the credential boundary. Social features may add
only the records needed for their product purpose:

- Friend edges: requester account id, receiver account id, state, timestamps.
- Block/mute edges: acting account id, target account id, timestamps.
- Guilds: guild id, name, heraldry id, motto, founder account id, timestamps.
- Guild membership: guild id, account id, role, state, timestamps.
- Presence: account id, coarse state, visibility setting, updated timestamp,
  expiry timestamp.
- Hub activity references: challenge ids, match ids, map ids, deed ids, and
  timestamps already produced by existing systems.
- Reports: reporter account id, target account id or content id, reason enum,
  optional short player-provided note, timestamps, moderation state.

Forbidden fields:

- Original DOS/Amiga game data, raw archives, decoded copyrighted assets, local
  save snapshots, or campaign progress uploads.
- Provider access tokens, refresh tokens, ID tokens, authorization codes,
  plaintext passwords, plaintext recovery codes, passkey private keys.
- Device keys as v2 credentials.
- Address books, contact imports, phone numbers, advertising ids, analytics
  ids, tracking ids, browser fingerprints, and exact IP logs as product data.
- Exact presence history, exact cursor/tile location, or full session timeline.

Player-visible copy must stay specific: "Serfbound stores friend/guild/presence
records only when you opt into the social realm; local play and game data stay
on your device."

## Product Flows

1. Accountless player lands in the same local game path as today.
2. Signed-in player opens the social hub from the Online panel.
3. Player finds or invites a friend by public name/account handle.
4. Friend accepts; both can see public profile rows and start direct matches.
5. Player creates or joins a guild; roster actions stay social-only.
6. Presence shows who is available without revealing game data or exact
   activity trails.
7. Hub surfaces direct challenges, guild challenges, friend/guild maps, ladder
   standing, and deed summaries.

## Later Phase Scope

The next unassigned phase numbers after 44 are reserved as candidate social
phases. They are not implemented by Phase 33.

| Candidate phase | Working title | Scope |
|---|---|---|
| 45 | Social graph foundation | Friend requests, block/mute, social service store, privacy contract tests. |
| 46 | Guild rosters | Guild service, roles, heraldry, roster UI, guild challenge entry points. |
| 47 | Presence and social hub | TTL presence, visibility controls, compact hub UI, direct challenge routing. |
| 48 | Social safety gate | Reporting, moderation queues, privacy sweep, accountless zero-network regression, hosted deployment proof. |

SB-33-05 remains the Phase 33 gate before those phases: email/provider/passkey
journeys, legacy standing claim, and the accountless regression.

## Explicit Non-Goals

- No global chat in the first social cut.
- No algorithmic social feed.
- No contact import.
- No analytics.
- No social reward that changes local gameplay balance.
- No account requirement for local single-player, local saves, local imported
  data, local custom maps, or local map editing.

## Stop Signals

- Any sign-in wall on an existing local path.
- Any collected social field without player-visible copy.
- Any provider token, credential secret, device key, original game data, or
  local save data entering social storage.
- Any feature code for friends, guilds, presence, or hub before its scoped
  phase starts.
