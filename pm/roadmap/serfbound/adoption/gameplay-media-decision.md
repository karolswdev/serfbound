# Gameplay Media Decision

**Status:** accepted (SB-28-01); extends
`adoption/asset-and-legal-boundary.md`.
**Date:** 2026-06-11.

## Decision

Serfbound may commit **screenshots of the running product** — images
that depict art decoded at runtime from the maintainer's own original
data — for the README, repository presentation, and the social
preview. This is the same posture the phase-evidence artifacts have
carried since Phase 10, extended to the public face.

## What may be committed

- Screenshots of the app rendering decoded art (PNG, quantized),
  captured by the seed-pinned pipeline
  (`npm run capture:readme:media`; seed `6235842872325272`; scenes:
  welcome, title, settlement, social-preview, mobile).
- First-party generated art (the §8 forge rules in the design
  standard).

## What may never be committed

Unchanged and absolute: original archives (`SPAU.PA` or any other),
extracted sprites/sounds as assets, or any file from which original
game data can be reconstructed. Screenshots are flattened
compositions of a running screen — the recognized norm for game
remake projects (the upstream freeserf ecosystem included) — and the
repository's README states whose data produced them.

## Mechanics

- Regeneration is one opt-in command from one recorded seed; the
  committed set lives in `docs/media/` under a **1.5MB budget**.
- `npm run check:media` (CI via `ci:release`) enforces: every README
  media reference exists, every committed image is referenced, and
  the budget holds.
- pngquant quantization is part of the pipeline (palette art
  quantizes essentially losslessly).

## Stop signal

A rights-holder objection to published screenshots → remove the set,
revisit here. The Phase 31 written consent record (`LICENSE-CONSENT.md`)
authorizes hosted converted runtime packages; screenshots remain governed by
this media decision unless a later written term says otherwise.
