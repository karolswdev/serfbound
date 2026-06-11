# Serfbound Design Standard

**Status:** canon (SB-32-01). UI-facing changes answer to this
document — mechanically, via PMO rule #8 in
[`pm/roadmap/PMO-CONTRACT.md`](../../pm/roadmap/PMO-CONTRACT.md).
**Changing taste means changing this file first**, then the UI.

---

## 1. Soul

Serfbound's soul lives inside the canvas: a medieval world decoded
from the player's own data — parchment, forest, gold, and iron,
rendered exactly as 1993 drew it. The shell around that canvas is
**the castle's antechamber**: it should feel like it was built by the
same hands. Warm, solid, quietly proud. Never a developer tool, never
louder than the game.

Three laws derive from this:

1. **The game is the hero.** Every composition centers the canvas;
   chrome recedes — most of all during play.
2. **The shell wears the game's materials.** Its colors are the
   game's parchment, woods, and metals; its surfaces feel like sign
   boards and ledgers, not glassmorphism.
3. **Every word is in the product's voice.** A player is a settler
   being welcomed, not an operator reading state.

## 2. Design tokens

Tokens are the single source of truth, shipped as CSS custom
properties in
[`packages/app/src/tokens.css`](../../packages/app/src/tokens.css).
Rules: **no raw hex/size literals in component CSS** — consume
tokens; new values enter here first, with a name and a reason.
`npm run check:design` enforces token hygiene.

### 2.1 Color — "the materials"

Derived from the shell's established idiom and the classic game's
material world (parchment UI panels, forest terrain, gold treasure,
iron tools). Semantic first; raw values live only in tokens.css.

| Token | Value | Material / use |
|---|---|---|
| `--sb-ink` | `#101411` | The night forest — page background |
| `--sb-surface` | `#1b201c` | Panel wood — cards, asides |
| `--sb-surface-raised` | `#242a24` | Lifted boards — hover, headers |
| `--sb-line` | `rgba(242, 236, 216, 0.14)` | Carved edges — borders, dividers |
| `--sb-parchment` | `#f2ecd8` | Body text on dark |
| `--sb-parchment-bright` | `#fff9e7` | Headings, key values |
| `--sb-moss` | `#a7b9a8` | Secondary text, labels |
| `--sb-gold` | `#d7c584` | The primary action — gold pays for deeds |
| `--sb-gold-deep` | `#b89f5a` | Primary hover/active |
| `--sb-on-gold` | `#221d14` | Text on gold |
| `--sb-steel` | `#d7ecf2` | Informational accents, focus ring |
| `--sb-banner-red` | `#b5524a` | Danger, destructive actions, defeat |
| `--sb-meadow` | `#7fae6e` | Success, victory, "your turn" |

Reserved (defined, used sparingly): `--sb-steel-dim`
(`rgba(42, 82, 92, 0.28)`) for quiet informational fills.

### 2.2 Type

System stack tuned warm; a display font is a recorded deferred
decision (license + glyph questions) — until then, weight and
spacing do the character work.

| Token | Value | Use |
|---|---|---|
| `--sb-font` | Inter, ui-sans-serif, system-ui, … | Everything |
| `--sb-text-xs` | `0.78rem` | Labels, kickers (uppercase, `--sb-track-wide`) |
| `--sb-text-sm` | `0.9rem` | Details, helper copy |
| `--sb-text-md` | `1rem` | Body, values |
| `--sb-text-lg` | `1.25rem` | Section titles |
| `--sb-text-hero` | `clamp(2.4rem, 6vw, 5.4rem)` | The wordmark |
| `--sb-weight-body` | `500` | Body |
| `--sb-weight-bold` | `700` | Values, labels |
| `--sb-weight-black` | `800` | Buttons, headings |
| `--sb-track-wide` | `0.08em` | Uppercase labels only |

### 2.3 Space, shape, depth, motion

| Token | Value | Notes |
|---|---|---|
| `--sb-space-1..6` | `4 / 8 / 12 / 16 / 24 / 32px` | The only spacing scale |
| `--sb-radius-sm` | `6px` | Controls, pills |
| `--sb-radius-md` | `10px` | Cards, panels |
| `--sb-radius-lg` | `14px` | The canvas frame, hero surfaces |
| `--sb-shadow-canvas` | `0 24px 80px rgba(0, 0, 0, 0.26)` | The game canvas only |
| `--sb-shadow-card` | `0 8px 28px rgba(0, 0, 0, 0.22)` | Raised cards, toasts |
| `--sb-ease` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | All transitions |
| `--sb-dur-fast` | `120ms` | Hover, focus |
| `--sb-dur-slow` | `240ms` | Panel/state changes |

Motion respects `prefers-reduced-motion: reduce` — transitions
collapse to none. Nothing in the shell ever auto-animates in a loop.

## 3. Components

Every visible shell element must be one of these (or amend this
inventory first). Each component defines **all of its states**;
"unstyled fallback" is a conformance failure.

- **Button / primary** (`.primary-action`): gold fill, `--sb-on-gold`
  text, weight black. States: rest, hover (`--sb-gold-deep`), focus
  (steel ring), active (translateY 1px), disabled (0.48 opacity, no
  hover). One primary per composition.
- **Button / secondary** (`.secondary-action`): parchment text on
  `rgba(242,236,216,0.06)` fill, `--sb-line` border. Same state set.
- **Pill / status** (`.runtime-pill` family): `--sb-steel-dim` fill,
  steel text, radius-sm. Variants: ok (meadow), warn (gold), danger
  (banner-red) — tinted fill + matching text.
- **Panel / group**: surface fill, radius-md, line border, a kicker
  label (`--sb-text-xs` uppercase moss), value (`parchment-bright`,
  bold), detail (`--sb-text-sm` moss).
- **Card** (lobby entries, profile rows): surface-raised, radius-md,
  card shadow; hover lifts via background, never via scale.
- **Badge / attention** (your-turn): meadow fill at 0.16 alpha,
  meadow text, radius-sm, weight bold — the only element allowed to
  pulse once on change (and never under reduced motion).
- **Input / text & drop zone**: surface fill, line border, radius-sm,
  focus ring; the drop zone adds a dashed `--sb-line` inner border
  and a gold highlight on dragover.
- **Toast / notice**: surface-raised, card shadow, radius-md, leading
  variant tint bar (ok/warn/danger).
- **Empty / loading / error patterns**: every async surface defines
  the three explicitly: empty (moss copy + the relevant action),
  loading (a quiet "…" pulse, no spinners), error (banner-red tint,
  plain-language copy, a retry affordance).
- **Lobby card** (`.lobby-card`, SB-32-04): surface fill, radius-md,
  card shadow; the challenger's name in parchment-bright black
  weight, the terms in moss small, one action. The empty lobby is a
  designed state (`.lobby-empty`: dashed line border, moss copy).
- **Match strip** (`.match-strip`, SB-32-04): a left-accent bar
  narrating the correspondence — steel at rest, meadow when it is
  your moment, banner-red on failure; one label, one line, always in
  the product voice; carries the closing ceremony when the match
  ends.

## 4. Layout

- **Grid**: game canvas as hero (`minmax(0,1fr)`), chrome column
  capped (`minmax(268px, 336px)`); under 760px the chrome stacks
  below the canvas, never above it.
- **Chrome states** (SB-32-02 builds these): `pre-import` (welcome
  composition), `title` (start-focused), `running` (chrome minimized;
  the canvas owns the viewport). The state lives on the root dataset
  and CSS keys off it.
- **Density**: panels use space-4 padding desktop, space-3 mobile;
  never more than two type sizes inside one component.

## 5. Voice and tone

The shell speaks like the game's herald: warm, brief, medieval-adjacent
without cosplay. Rules:

- Address the player as "you"; Serfbound is "we" only when promising
  ("your data never leaves this device").
- No developer vocabulary: *runtime, dataset, IndexedDB, archive
  entry, checksum* never reach player copy (the error-report tool may
  keep technical detail one click deep).
- Errors say what happened and what to do next, in one breath:
  "That file isn't the one — Serfbound needs your SPAU.PA. Check the
  demo download if you don't own the game."
- Celebrate sparingly and mean it: victory, first castle, a match's
  closing ceremony.
- Labels are nouns ("Save", "Lobby"), actions are verbs ("Import your
  data", "Post a challenge", "Attest the result").

## 6. Accessibility floor

Non-negotiable, tested (Phase 8 suite + the conformance pass):

- Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 1.25rem bold). Token pairs are
  pre-cleared: parchment/ink 14.9:1, moss/surface 6.7:1, on-gold/gold
  9.2:1.
- Focus is always visible: the steel ring, 3px, offset 3px — never
  removed, only restyled.
- Touch targets ≥ 44px; the existing `min-height: 44px` is law.
- `prefers-reduced-motion` honored globally.
- Color never carries meaning alone (the badge has words, not just
  green).

## 7. Conformance (rule #8)

Any commit touching UI-facing paths (`packages/app/src/*.css`,
`index.html`, `public/`) must either update this standard/tokens in
the same commit, or carry `.tmp/DESIGN-OK.md` with a one-line
rationale, **and** certify the contract's checkbox 8. The judgment
call for shell markup in `main.ts` is covered by the checkbox: if a
change adds or alters anything a player sees, it conforms to this
document or says why not. `npm run check:design` keeps tokens honest
(no orphans, no raw hex drift in component CSS).

## 8. Assets

Generated first-party art (e.g. pixellab) may be commissioned for the
shell (emblem, ornaments, social preview) and committed — it is ours.
It must read as kin to the game's art (palette above, chunky pixel
confidence, no gradients-and-glow modernism) and must never imitate
copyrighted sprites closely enough to be confused for them. Original
game data stays uncommittable, always.

---

*Amendments: PR against this file first; the UI follows. Taste
arguments end here, on the record.*
