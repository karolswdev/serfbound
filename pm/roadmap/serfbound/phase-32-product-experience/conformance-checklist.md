# Phase 32 — Conformance Checklist (SB-32-05)

Every visible shell element mapped to its standard component
(`docs/design/design-standard.md` §3). Mechanical backing:
`npm run check:design` (43/43 tokens consumed, raw-color ratchet 0),
rule #8 in the pre-commit hook, and the Phase 8 compatibility suite
(5/5 positions green after the gate's findings, below).

## Element → component map

| Surface | Elements | Standard component | State coverage |
|---|---|---|---|
| Header | emblem, kicker, wordmark, status pill | Brand block + Pill | chrome states shrink/hide per §4 |
| Canvas | terrain-preview | The hero (§4 layout) | radius-lg, canvas shadow, all states |
| Welcome | card, drop zone, error, promise, hint | Welcome card + Input/drop zone | rest/hover/dragover/busy/error; gone post-import |
| Panel groups ×6 | titles, label/value rows, details | Panel/group | pre-import/title accents, running density |
| Controls | START, build/save/load/etc. | Button primary/secondary | rest/hover/focus/active/disabled |
| Import | input + canonical control + zone | Input + one canonical keyboard path (§6) | zone aria-hidden, control = first Tab |
| Online | account row, explainer, lobby, badge, strip, seal, attest | Card/Badge/Match strip | signed-out/in/unavailable, quiet/populated lobby, 6 strip lines, 4 ceremony outcomes |
| Chronicle | history row | Panel row | empty ("No matches yet") / counted |
| Notices | notification-live, toasts via notice path | Toast/notice | aria-live preserved |

## Voice pass

Player-facing copy reviewed against §5: no developer vocabulary on
any player path; labels are nouns, actions are verbs; the privacy
promise and device-key explainer carry the posture as features.
**Recorded exceptions:** the Phase 8 test-locked import strings
("File not usable", "… cannot be used. Choose SPAU.PA to start." and
status values like "Data imported") — already plain-voiced, kept
verbatim to preserve the behavior contract.

## Accessibility floor (§6)

- Contrast: measured ≥ 4.5:1 in the compatibility suite (5/5).
- First Tab = the canonical Import control on every engine — restored
  at this gate after two real findings:
  1. the welcome drop zone stole the tab order (fixed: duplicate
     pointer affordances are keyboard-skipped; §6 amended);
  2. scrollable containers joined the tab order (Firefox: always;
     Chromium: when childless of focusables) — pre-import the page
     scrolls instead of the scene/panel.
- Reduced motion: all durations are tokens that collapse to 0.
- Touch targets ≥ 44px: preserved on every control.

## Gate verdict

The maintainer's sign-off (or punch list) closes this checklist —
recorded in evidence-story-05.
