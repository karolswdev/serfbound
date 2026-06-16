// Bake the rig catalog (SB-44-03) into static fixtures the app boots into.
// Each scenario is run through the REAL engine start + world-action path; the
// resulting local-game snapshot is round-tripped through restoreSerfboundLocalGame
// and its expectations are checked here, so a rig that no longer reaches its
// state fails the build instead of the maintainer's device. Output lands in
// public/rigs/, served by vite at /rigs/ and shipped by `vite build`.
//
//   npm run build:rigs   (runs `npm run build` first to refresh dist/)

import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const outDir = resolve(repoRoot, "public/rigs");

const {
  buildLocalGameRig,
  rigScenarios,
  checkRigExpectation,
} = await import("../packages/test-support/dist/index.js");
const { restoreSerfboundLocalGame } = await import("../packages/engine/dist/index.js");

const scenarios = rigScenarios();
const seenIds = new Set();
const seenChecks = new Map(); // check id -> rig id (first wins)
const manifestRigs = [];
const byCheck = {};
let failures = 0;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const scenario of scenarios) {
  if (!/^[a-z0-9-]+$/.test(scenario.id)) {
    throw new Error(`rig id "${scenario.id}" must match ^[a-z0-9-]+$`);
  }
  if (seenIds.has(scenario.id)) {
    throw new Error(`duplicate rig id "${scenario.id}"`);
  }
  seenIds.add(scenario.id);

  const covers = scenario.covers ?? [scenario.check];
  const fixture = {
    schemaVersion: 1,
    kind: "serfbound.rig",
    rigKind: scenario.kind,
    id: scenario.id,
    gate: scenario.gate,
    check: scenario.check,
    covers,
    title: scenario.title,
    instruction: scenario.instruction,
    result: scenario.result,
  };

  if (scenario.kind === "local-game") {
    const snapshot = buildLocalGameRig(scenario);
    // Self-check: a fresh restore must replay to the expected world state.
    const restored = restoreSerfboundLocalGame(snapshot);
    if (restored.status !== "started") {
      console.error(`✗ ${scenario.id}: restore rejected — ${restored.message}`);
      failures += 1;
      continue;
    }
    const world = restored.game.world();
    const misses = (scenario.expected ?? [])
      .map((expectation) => checkRigExpectation(world, expectation))
      .filter((message) => message !== null);
    if (misses.length > 0) {
      console.error(`✗ ${scenario.id}: ${misses.join("; ")}`);
      failures += 1;
      continue;
    }
    fixture.snapshot = snapshot;
    // Carry the expectations so verify-rigs can re-check independently.
    fixture.expected = scenario.expected ?? [];
  } else {
    // editor-draft / gallery rigs carry a custom map the app surface consumes.
    if (scenario.map === undefined) {
      throw new Error(`rig "${scenario.id}" (${scenario.kind}) needs a map`);
    }
    fixture.map = scenario.map;
  }

  await writeFile(resolve(outDir, `${scenario.id}.json`), `${JSON.stringify(fixture)}\n`);

  manifestRigs.push({
    id: scenario.id,
    gate: scenario.gate,
    check: scenario.check,
    covers,
    kind: scenario.kind,
    title: scenario.title,
    instruction: scenario.instruction,
    result: scenario.result,
    deepLink: `?rig=${scenario.id}`,
  });
  for (const check of covers) {
    if (!seenChecks.has(check)) {
      seenChecks.set(check, scenario.id);
      byCheck[check] = scenario.id;
    }
  }
  console.log(`✓ ${scenario.id}  (${scenario.kind}, covers ${covers.join(", ")})`);
}

if (failures > 0) {
  console.error(`\n${failures} rig(s) failed to bake.`);
  process.exit(1);
}

// The order the maintainer walks rigs in: the manifest sequence.
const manifest = {
  schemaVersion: 1,
  kind: "serfbound.rig-manifest",
  generatedBy: "scripts/build-rigs.mjs",
  rigs: manifestRigs,
  byCheck,
};
await writeFile(resolve(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\nBaked ${manifestRigs.length} rigs → public/rigs/ (manifest covers ${Object.keys(byCheck).length} checks).`);
