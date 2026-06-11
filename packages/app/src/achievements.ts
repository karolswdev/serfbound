// Achievements (SB-30-03): a curated set of deeds, every trigger an
// engine-proven fact the app already tracks — derived, never
// collected, never blocking play. Badge art is the player's own
// decoded icon sheet (the DOS icon indices below are the same ones
// the original popups draw); names stay inside the game font's
// alphabet because the unlock toast speaks through it.

export type AchievementDefinition = {
  readonly id: string;
  // Game-font safe: A-Z, digits, spaces, hyphens.
  readonly name: string;
  readonly description: string;
  // DOS icon-sheet index (decoded at runtime from the player's data).
  readonly icon: number;
};

export type AchievementFacts = {
  readonly dataImported: boolean;
  readonly hasCastle: boolean;
  readonly buildingsDone: number;
  readonly savedOnce: boolean;
  readonly played: number;
  readonly won: number;
  readonly bestStreak: number;
  readonly onlinePlayed: number;
  readonly onlineWon: number;
  readonly missionsWon: number;
};

type Trigger = (facts: AchievementFacts) => boolean;

const triggers: ReadonlyMap<string, Trigger> = new Map([
  ["realm-awakens", (f: AchievementFacts) => f.dataImported],
  ["founder", (f: AchievementFacts) => f.hasCastle],
  ["master-builder", (f: AchievementFacts) => f.buildingsDone >= 10],
  ["realm-of-stone", (f: AchievementFacts) => f.buildingsDone >= 25],
  ["keeper", (f: AchievementFacts) => f.savedOnce],
  ["first-deed", (f: AchievementFacts) => f.played >= 1],
  ["victor", (f: AchievementFacts) => f.won >= 1],
  ["on-a-tear", (f: AchievementFacts) => f.bestStreak >= 3],
  ["envoy", (f: AchievementFacts) => f.onlinePlayed >= 1],
  ["rated", (f: AchievementFacts) => f.onlineWon >= 1],
  ["campaigner", (f: AchievementFacts) => f.missionsWon >= 1],
  ["conqueror", (f: AchievementFacts) => f.missionsWon >= 5],
]);

export const serfboundAchievements: readonly AchievementDefinition[] = [
  { id: "realm-awakens", name: "THE REALM AWAKENS", description: "Bring your own data and the world exists.", icon: 0x28 },
  { id: "founder", name: "FOUNDER", description: "Raise your first castle.", icon: 0x32 },
  { id: "master-builder", name: "MASTER BUILDER", description: "Ten buildings standing complete.", icon: 0x29 },
  { id: "realm-of-stone", name: "REALM OF STONE", description: "Twenty-five buildings standing complete.", icon: 0x2b },
  { id: "keeper", name: "KEEPER", description: "Save your realm for another day.", icon: 0x37 },
  { id: "first-deed", name: "FIRST DEED", description: "Finish your first match, however it went.", icon: 0x31 },
  { id: "victor", name: "VICTOR", description: "Win a match.", icon: 0x30 },
  { id: "on-a-tear", name: "ON A TEAR", description: "Three wins in a row.", icon: 0x36 },
  { id: "envoy", name: "ENVOY", description: "Complete a match over the internet.", icon: 0x2d },
  { id: "rated", name: "RATED", description: "Win an online match - the ladder remembers.", icon: 0x2f },
  { id: "campaigner", name: "CAMPAIGNER", description: "Win your first campaign mission.", icon: 0x2a },
  { id: "conqueror", name: "CONQUEROR", description: "Win five campaign missions.", icon: 0x2e },
];

export function achievementById(id: string): AchievementDefinition | undefined {
  return serfboundAchievements.find((entry) => entry.id === id);
}

// Pure: which deeds the facts satisfy right now (unlock bookkeeping
// belongs to the profile, not this function).
export function evaluateAchievements(facts: AchievementFacts): readonly string[] {
  const satisfied: string[] = [];
  for (const definition of serfboundAchievements) {
    if (triggers.get(definition.id)?.(facts) === true) {
      satisfied.push(definition.id);
    }
  }

  return satisfied;
}
