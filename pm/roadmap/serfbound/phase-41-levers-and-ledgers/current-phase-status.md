# Phase 41 — Levers and Ledgers

**Last updated:** 2026-06-11 (scaffolded from the reference parity
audit addendum, rows 18–22 player-facing halves).
**Status:** scaffolded.

## Goal

The player gets the original's levers and its ledgers. Levers: the
settings popups — distribution sliders for food/planks/steel/coal/
wheat, tool-making priorities, the draggable 26-entry transport
priority list, inventory in/stop/out toggles, serf-to-knight rate —
driving the engine data SB-36-07 lays down. Ledgers: the 20-message
notification system (a hut under attack off-screen is news), the
history charts and player score behind the original stat windows,
and the minimap's missing modes. Today the player can tune knight
occupation and audio volume, and nothing else; the stats popup is a
flat resource grid; four toast types stand in for the messenger.

## Reference ground truth (Freeserf.Core)

- PlayerSettings.cs + UI/PopupBox.cs: every slider the original
  exposes — food to 4 mines, plank/steel/coal/wheat splits, 9 tool
  priorities, flag and inventory priority lists, inventory modes,
  SerfToKnightRate, CastleKnightsWanted.
- Notification.cs: the 20 typed messages with map positions —
  UnderAttack, LoseFight, WinFight, MineEmpty, LostLand,
  FoundGold/Iron/Coal/Stone, EmergencyActive/Neutral,
  CallToLocation, the save-age nudges — and the NotificationBox
  flow with go-to-position.
- Game.cs 2608–2768 + Player.cs: the 4-timescale history buffers
  (112 slots: land, buildings, military, total score), the 120-slot
  resource history, score calculation, the original chart windows.
- UI/Minimap.cs: ownership modes (None/Solid/Mixed), scale,
  building/road overlays.
- Savegame.cs: serf state serializes — the recorded
  local-game.ts:128 gap (restored games re-dispatch) closes with
  the ledger work.

## Exit criteria (evidence required)

- [ ] The settings popups exist in original art and drive the
  SB-36-07 engine data; a slider move changes what the scheduler
  does, provably. (SB-41-01)
- [ ] The messenger: the 20 notification types fire with positions,
  the notification box pages and jumps the viewport. (SB-41-02)
- [ ] The ledger: history buffers record on the reference cadence,
  score computes, the stat chart windows render them. (SB-41-03)
- [ ] The minimap's modes: ownership, scale, overlays. (SB-41-04)
- [ ] In-flight serf state serializes; a save mid-stride restores
  mid-stride. (SB-41-05)
- [ ] On-device: the maintainer tunes a distribution, gets attacked
  off-screen, reads about it, and finds the fight on the map.
  (SB-41-06, the device gate)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-41-01 | The levers | backlog | — | — |
| SB-41-02 | The messenger | backlog | — | — |
| SB-41-03 | The ledger | backlog | — | — |
| SB-41-04 | The minimap in full | backlog | — | — |
| SB-41-05 | Saves mid-stride | backlog | — | — |
| SB-41-06 | The device gate | backlog | — | — |
