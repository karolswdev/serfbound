# SB-44-17 — The Protocol Deck, Properly Designed

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-14/16 (the asset library + verdict buttons)
- **Owner:** unassigned

## Problem

The deck looked amateurish. The three verdict buttons were three unrelated
materials (green cobblestone / red brick / gold plank) — generated
independently, they could never cohere. Font sizes were per-element em soup
(`0.46em / 0.5em / 0.62em / 0.92em`), the corner seals didn't match each
other, and each check sat as a small card stranded in a tall black void.

## What ships

- **A coherent verdict-plaque family.** One brass-framed plaque (the
  best-generated base), recolored *programmatically* — a masked hue-shift
  recolors only the interior enamel, leaving the frame pixel-identical — into
  emerald / ruby / amber, plus a neutral wood for the rig/report buttons.
  `btn-pass/fail/skip/wood.png`.
- **A coherent seal family.** The recorded-verdict corner stamps regenerated
  (PixelLab) as one gold-rimmed wax-disc + ribbon set: green ✓, red crossed
  swords, amber ↑. `seal-pass/fail/skip.png`.
- **One type scale.** Every size draws from `--fs-xs … --fs-xl`; the em soup
  is gone. **Cinzel** display serif for headings (system-serif fallback when
  the font CDN is blocked).
- **A composed app screen, not a floating form.** Each check fills the
  viewport: a framed circular **portrait** of the phase's subject (the
  `gate-NN` sprite), the instruction as the headline, Watch/Pass-when in an
  inset panel, and the verdict bar pinned to the bottom thumb zone. Phase
  intros get the large-portrait treatment.

## freeserf.net boundary

Held. First-party art (PixelLab + ImageMagick recolor); deck tooling only,
not player-facing product code (per this phase's design-rule note).

## Acceptance criteria

- [x] The three verdict buttons are one coherent family — identical brass
  frame, only the enamel hue differs (`artifacts/hero-check-pass.png`).
- [x] One type scale + Cinzel headings; no per-element em soup.
- [x] Each check is a full-bleed screen with a character portrait hero and a
  bottom-pinned verdict bar (`artifacts/hero-check.png`, `hero-phase.png`).
- [x] All deck behaviour intact — 32/32 assertions (`verify-deck.mjs`).
