# Phase 29 artifacts — provenance

- `story-04-public-lobby.png`, `story-04-public-your-turn.png`,
  `story-04-public-match-ended.png` — captured 2026-06-11 from the
  public-backbone match (`https://api.serfbound.com`) run with the
  maintainer's **real local `SPAU.PA`** (opt-in, gitignored boundary),
  per the Phase 10 standing rule that visual gates capture from real
  data. An earlier same-day capture used the synthetic CI fixture
  archive (test-sprite art) and was replaced; both runs agreed on the
  same boundary checksum, `1088464342` — the simulation is
  metadata-deterministic, only the art differs. Production stores
  were wiped pristine after each run.
- `story-04-serfbound-com-landing.png` — `https://serfbound.com`
  serving the game shell (pre-import title state; no game data
  involved).

The images depict art decoded at runtime from user-owned data; no
original game data is committed — the phase-10 artifact precedent.
