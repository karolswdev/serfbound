# SB-44-01 — The Protocol Deck

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** —
- **Unblocks:** SB-44-02 (it captures and exports the verdicts this deck collects); the Bucket-A gate closures (35–39, 42, 43)
- **Owner:** unassigned

## Problem

Seven phases (35, 36, 37, 38, 39, 42, 43) have all their engineering
done but stay open: the framework closes them only when the maintainer
plays on a real device and signs off. The first attempt was a flat
markdown checklist — wrong instrument for a phone: it doesn't sequence
the work, and it has nowhere to record what happened at each check. The
maintainer asked for a steppable presentation he can execute in order
and give feedback against.

## What ships

A self-contained reveal.js deck at
`phase-44-gate-verification/playtest/index.html`:

- **Every Bucket-A gate, in execution order.** One phase per horizontal
  section; within it, an intro slide then one slide per check. Each
  check carries the exact criterion from that phase's
  `current-phase-status.md`: what to do, what to watch, and the
  pass condition.
- **Executable verdicts.** Each check has large-tap-target Pass / Fail /
  Skip buttons and a notes field. Tapping records a verdict (tap again
  to clear); an always-visible progress chip shows `decided/total` with
  per-status counts.
- **Phase 43 honesty.** Its slide warns that SB-43-05 (moderation +
  lobby wiring) is still un-written engineering, not a pure verification
  pass — a Skip there is the signal that the moderation slice needs code
  before that gate can close.
- **Offline-resilient.** reveal.js loads from CDN as a progressive
  enhancement; if it's blocked, the body falls back to a scrollable
  stack and the full protocol still renders. A phone with no network can
  still run it.

Verdicts live in memory in this story (a refresh loses them) — making
them durable and exportable is SB-44-02.

## freeserf.net boundary

None — this is roadmap verification tooling, not product runtime. It
touches no engine, asset, renderer, or app code, and is not a
player-facing path (so the design-standard rule #8 does not apply).

## Acceptance criteria

- [x] All seven gate phases (35, 36, 37, 38, 39, 42, 43) render as
  ordered sections; 36 check slides total, each with its do/watch/pass
  text. (verify-deck.mjs, real Chromium)
- [x] Each check has Pass/Fail/Skip + notes; a verdict activates the
  button and moves the progress chip; re-tapping clears it.
- [x] reveal.js initializes when the CDN is reachable; when blocked, the
  offline fallback engages and the protocol still renders all 36 checks.
- [x] No console or page errors on load; legible at a 414×896 phone
  viewport (screenshot captured).

## Honest limits

- Verdicts are in-memory only — closed by SB-44-02 (persistence + export).
- reveal.js is a CDN dependency; the offline path is a degraded
  scrollable stack, not the stepped presentation. Vendoring reveal for a
  first-class offline deck is a possible follow-up, not in scope here.
- The deck states the criteria; it does not and cannot certify the gates
  — only the maintainer's device pass does that.
