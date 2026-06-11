# Social Identity Decision (v2)

**Status:** accepted — supersedes the identity portion of the
Phase 25 decision record by maintainer direction.
**Date:** 2026-06-11.
**Authority:** the maintainer, verbatim in spirit: "the product
evolved. Phase 25's decision is no longer applicable. This is also
very much a social game for those who want it. You don't have to opt
in and even register to have the single player experience, but if
you do — a completely new settlers experience comes in."

## What changes

Serfbound is, by product definition, also a **social game for those
who opt in**. Familiar sign-in becomes sanctioned: email + password,
federated identity providers (Apple, Google, Meta), and passkeys —
alongside, not replacing, the existing device keys (which become one
linkable credential among several).

## What does not change — the two unbreakables

1. **Accountless, serverless single-player is first-class forever.**
   No registration, no sign-in, no network — the complete classic
   game, exactly as today. Nothing social may gate, degrade, nag, or
   visually demote it.
2. **Honesty about what is collected.** The old promise ("nothing to
   leak") was true because nothing was collected; the new promise
   must be equally true in its new shape: collect the minimum the
   chosen sign-in method requires, state it plainly where players
   see it, never sell or mine it, and keep game data uploads
   impossible (the wire formats still carry no field for them).

## Why supersede

Phase 25 optimized for a world where Serfbound's online play was a
trustless mailbox between strangers. The product grew: a ladder,
identities with faces and banners, deeds, chronicles — a social
platform in everything but its door. The maintainer has decided the
door should open the way players expect doors to open.

## Consequences (Phase 33 carries these)

- The identity service grows real account credentials: passwords
  (hashed, never logged), OAuth/OIDC flows, passkeys, recovery — the
  four-field schema is formally retired as a ceiling and replaced by
  a documented, contract-tested v2 schema.
- Device-key accounts remain valid and become linkable to v2
  accounts (no one loses their ladder standing).
- The privacy posture, the shell's sign-in copy, the player guide,
  and the README all rewrite together — the promise changes shape in
  every place it is printed, in one story.
- The SB-30-04 stop-and-decide service pair (reject nameless
  challenges; lobby challenger keyId) folds into the v2 service work.
- What "a completely new settlers experience" includes (friends,
  real guild rosters, presence, social hub) is Phase 33's discovery
  story, shaping the phases after it.

## Stop signals

- Any design where accountless play sees a sign-in wall or loses a
  feature it has today.
- Any collected field without a player-visible sentence explaining
  it.
- Credentials or tokens in logs, error reports, or analytics (there
  are no analytics; that stands).
