import { defineConfig, type Plugin } from "vite";
import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// SB-44-05: publish the gate-verification deck (the hosted protocol + report
// surface with rig triggers, SB-44-01..03) alongside the app at /playtest/, so
// it is served same-origin with the game. Same origin = the deck's deep-links
// reach the rig loader and its verdict store is the one the in-game HUD writes,
// unifying both capture surfaces into one report. The deck stays sourced in
// pm/ (single source of truth); this copies it into the build output.
function publishPlaytestDeck(): Plugin {
  const deckDir = resolve(here, "pm/roadmap/serfbound/phase-44-gate-verification/playtest");
  return {
    name: "serfbound-publish-playtest-deck",
    apply: "build",
    closeBundle() {
      const destDir = resolve(here, "dist/playtest");
      mkdirSync(destDir, { recursive: true });
      copyFileSync(resolve(deckDir, "index.html"), resolve(destDir, "index.html"));
      // SB-44-09: the deck wears the shell's gumps too — ship its material
      // chrome alongside it so the protocol reads as part of the game.
      cpSync(resolve(deckDir, "gumps"), resolve(destDir, "gumps"), { recursive: true });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [publishPlaytestDeck()],
});
