import type { SerfboundMatchHistoryEntry } from "./profile-store.js";

// Profile statistics (SB-30-02): derived, never collected — pure
// functions over the local match history the profile already keeps.

export type ProfileStatistics = {
  readonly played: number;
  readonly won: number;
  readonly lost: number;
  readonly completed: number;
  readonly abandoned: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastPlayedIso: string | null;
};

// History arrives newest-first (the store's contract).
export function deriveProfileStatistics(
  history: readonly SerfboundMatchHistoryEntry[],
): ProfileStatistics {
  let won = 0;
  let lost = 0;
  let completed = 0;
  let abandoned = 0;
  for (const entry of history) {
    if (entry.result === "won") {
      won += 1;
    } else if (entry.result === "lost") {
      lost += 1;
    } else if (entry.result === "completed") {
      completed += 1;
    } else {
      abandoned += 1;
    }
  }

  let currentStreak = 0;
  for (const entry of history) {
    if (entry.result !== "won") {
      break;
    }

    currentStreak += 1;
  }

  let bestStreak = 0;
  let run = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.result === "won") {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    played: history.length,
    won,
    lost,
    completed,
    abandoned,
    currentStreak,
    bestStreak,
    lastPlayedIso: history[0]?.endedAtIso ?? null,
  };
}

export const matchModeLabels: Record<SerfboundMatchHistoryEntry["mode"], string> = {
  hotseat: "Hot-seat",
  "realtime-loopback": "Realtime",
  "async-loopback": "Async",
  online: "Online",
};
