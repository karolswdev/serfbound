import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createProfile,
  deriveProfileStatistics,
  matchModeLabels,
  withMissionCompleted,
} from "@serfbound/app";

// SB-30-02: statistics are derived, never collected — checked against
// hand-computed fixtures.

const entry = (result, endedAtIso, mode = "online") => ({
  mode,
  opponentName: "RIVAL",
  localPlayer: 0,
  result,
  endedAtIso,
});

test("an empty history derives empty statistics", () => {
  const stats = deriveProfileStatistics([]);
  assert.deepEqual(stats, {
    played: 0,
    won: 0,
    lost: 0,
    completed: 0,
    abandoned: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedIso: null,
  });
});

test("a mixed history, hand-checked (newest first)", () => {
  // Chronological (oldest -> newest): W W L W W W A L W W
  // Best streak: 3 (the middle run). Current streak: 2 (the newest
  // two wins). Newest-first order below.
  const history = [
    entry("won", "2026-06-11T10:00:00Z"),
    entry("won", "2026-06-10T10:00:00Z"),
    entry("lost", "2026-06-09T10:00:00Z"),
    entry("abandoned", "2026-06-08T10:00:00Z", "async-loopback"),
    entry("won", "2026-06-07T10:00:00Z"),
    entry("won", "2026-06-06T10:00:00Z", "hotseat"),
    entry("won", "2026-06-05T10:00:00Z"),
    entry("lost", "2026-06-04T10:00:00Z"),
    entry("won", "2026-06-03T10:00:00Z", "realtime-loopback"),
    entry("won", "2026-06-02T10:00:00Z"),
  ];
  const stats = deriveProfileStatistics(history);
  assert.equal(stats.played, 10);
  assert.equal(stats.won, 7);
  assert.equal(stats.lost, 2);
  assert.equal(stats.abandoned, 1);
  assert.equal(stats.completed, 0);
  assert.equal(stats.currentStreak, 2, "the newest run of wins");
  assert.equal(stats.bestStreak, 3, "the longest run anywhere");
  assert.equal(stats.lastPlayedIso, "2026-06-11T10:00:00Z");
});

test("every history mode has a player-facing label", () => {
  for (const mode of ["hotseat", "realtime-loopback", "async-loopback", "online"]) {
    assert.equal(typeof matchModeLabels[mode], "string");
    assert.equal(matchModeLabels[mode].length > 0, true);
  }
});

test("the campaign ledger records each mission once", () => {
  let profile = createProfile("karol");
  assert.equal(profile.missionsCompleted, undefined);
  profile = withMissionCompleted(profile, "MISSION-1");
  profile = withMissionCompleted(profile, "MISSION-1");
  profile = withMissionCompleted(profile, "MISSION-2");
  assert.deepEqual(profile.missionsCompleted, ["MISSION-1", "MISSION-2"]);
});
