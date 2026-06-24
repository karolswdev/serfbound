import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const workspaceRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const definition = normalizedText(
  "pm/roadmap/serfbound/adoption/social-experience-definition.md",
);
const phaseStatus = normalizedText(
  "pm/roadmap/serfbound/phase-33-social-realm/current-phase-status.md",
);
const roadmap = normalizedText("pm/roadmap/serfbound/README.md");

test("social experience definition preserves the two unbreakables", () => {
  for (const phrase of [
    "Accountless play remains first-class",
    "no registration, no sign-in, no network",
    "no feature loss",
    "local play and game data stay on your device",
  ]) {
    assert.ok(definition.includes(phrase), `definition preserves accountless posture: ${phrase}`);
  }

  for (const phrase of [
    "No account requirement for local single-player",
    "local saves",
    "local imported data",
    "local custom maps",
    "local map editing",
  ]) {
    assert.ok(definition.includes(phrase), `definition forbids local play gating: ${phrase}`);
  }
});

test("social pillars are scoped without implementing feature code", () => {
  for (const heading of [
    "### Friends",
    "### Real Guild Rosters",
    "### Presence",
    "### Social Hub",
  ]) {
    assert.ok(definition.includes(heading), `definition names pillar: ${heading}`);
  }

  assert.ok(definition.includes("They are not implemented by Phase 33."));
  assert.ok(definition.includes("Any feature code for friends, guilds, presence, or hub"));
});

test("social data posture forbids secrets, tracking, and original game data", () => {
  for (const phrase of [
    "Original DOS/Amiga game data",
    "raw archives",
    "local save snapshots",
    "Provider access tokens",
    "plaintext passwords",
    "passkey private keys",
    "Device keys as v2 credentials",
    "Address books",
    "analytics ids",
    "browser fingerprints",
    "exact IP logs as product data",
  ]) {
    assert.ok(definition.includes(phrase), `definition forbids collected field: ${phrase}`);
  }
});

test("later social phases are explicitly bounded after the identity gate", () => {
  for (const phrase of [
    "| 45 | Social graph foundation |",
    "| 46 | Guild rosters |",
    "| 47 | Presence and social hub |",
    "| 48 | Social safety gate |",
    "SB-33-05 remains the Phase 33 gate",
  ]) {
    assert.ok(definition.includes(phrase), `definition scopes later phase: ${phrase}`);
  }

  assert.ok(phaseStatus.includes("social-experience definition"));
  assert.ok(roadmap.includes("social-experience definition"));
});

function normalizedText(path) {
  return readFileSync(join(workspaceRoot, path), "utf8").replace(/\s+/g, " ");
}
