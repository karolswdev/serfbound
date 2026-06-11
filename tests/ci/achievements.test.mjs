import assert from "node:assert/strict";
import { test } from "node:test";

import {
  achievementById,
  createProfile,
  evaluateAchievements,
  serfboundAchievements,
  withAchievement,
} from "@serfbound/app";

// SB-30-03: every deed maps to an engine-proven fact; names fit the
// game font; unlocks record once.

const noFacts = {
  dataImported: false,
  hasCastle: false,
  buildingsDone: 0,
  savedOnce: false,
  played: 0,
  won: 0,
  bestStreak: 0,
  onlinePlayed: 0,
  onlineWon: 0,
  missionsWon: 0,
};

test("the curated set: 12 unique deeds, game-font-safe names", () => {
  assert.equal(serfboundAchievements.length, 12);
  assert.equal(new Set(serfboundAchievements.map((a) => a.id)).size, 12);
  for (const deed of serfboundAchievements) {
    assert.match(deed.name, /^[A-Z0-9 -]+$/, `${deed.id} name renders in the game font`);
    assert.equal(typeof deed.icon, "number");
    assert.equal(deed.description.length > 0, true);
  }
});

test("no facts, no deeds; each trigger flips with exactly its fact", () => {
  assert.deepEqual(evaluateAchievements(noFacts), []);
  const cases = [
    [{ dataImported: true }, "realm-awakens"],
    [{ hasCastle: true }, "founder"],
    [{ buildingsDone: 10 }, "master-builder"],
    [{ buildingsDone: 25 }, "realm-of-stone"],
    [{ savedOnce: true }, "keeper"],
    [{ played: 1 }, "first-deed"],
    [{ won: 1 }, "victor"],
    [{ bestStreak: 3 }, "on-a-tear"],
    [{ onlinePlayed: 1 }, "envoy"],
    [{ onlineWon: 1 }, "rated"],
    [{ missionsWon: 1 }, "campaigner"],
    [{ missionsWon: 5 }, "conqueror"],
  ];
  for (const [overrides, id] of cases) {
    const satisfied = evaluateAchievements({ ...noFacts, ...overrides });
    assert.equal(satisfied.includes(id), true, `${id} unlocks from its fact`);
  }

  // Thresholds gate properly.
  assert.equal(evaluateAchievements({ ...noFacts, buildingsDone: 9 }).includes("master-builder"), false);
  assert.equal(evaluateAchievements({ ...noFacts, bestStreak: 2 }).includes("on-a-tear"), false);
  assert.equal(evaluateAchievements({ ...noFacts, missionsWon: 4 }).includes("conqueror"), false);
});

test("a deed records once, with its moment", () => {
  let profile = createProfile("karol");
  profile = withAchievement(profile, "founder", "2026-06-11T10:00:00Z");
  profile = withAchievement(profile, "founder", "2026-06-12T10:00:00Z");
  assert.deepEqual(profile.achievements, [{ id: "founder", unlockedAtIso: "2026-06-11T10:00:00Z" }]);
  assert.equal(achievementById("founder")?.name, "FOUNDER");
});
