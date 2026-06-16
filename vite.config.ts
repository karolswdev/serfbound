import { defineConfig, type Plugin } from "vite";
import { copyFileSync, mkdirSync } from "node:fs";
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
  const source = resolve(
    here,
    "pm/roadmap/serfbound/phase-44-gate-verification/playtest/index.html",
  );
  return {
    name: "serfbound-publish-playtest-deck",
    apply: "build",
    closeBundle() {
      const destDir = resolve(here, "dist/playtest");
      mkdirSync(destDir, { recursive: true });
      copyFileSync(source, resolve(destDir, "index.html"));
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [publishPlaytestDeck()],
});
