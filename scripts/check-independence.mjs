// The independence guard (SB-24-04): Serfbound is browser-native
// TypeScript, derived from the behavior of GPL ancestors but carrying
// none of their toolchain. This fails the build if any .NET artifact
// appears anywhere in the tree. (Honest behavioral citations in
// comments are welcome — this checks artifacts, not acknowledgments.)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbiddenExtensions = [
  ".cs",
  ".csproj",
  ".sln",
  ".fsproj",
  ".vbproj",
  ".nupkg",
  ".dll",
  ".exe",
];
const forbiddenNames = [
  "nuget.config",
  "global.json",
  "directory.build.props",
  "directory.build.targets",
  "appveyor.yml",
];
const skipDirectories = new Set([".git", "node_modules", "dist", "test-results", "playwright-report", ".tmp", "serfbound-local-data"]);

const offenders = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (!skipDirectories.has(entry)) {
        walk(path);
      }

      continue;
    }

    const lower = entry.toLowerCase();
    if (
      forbiddenExtensions.some((extension) => lower.endsWith(extension)) ||
      forbiddenNames.includes(lower)
    ) {
      offenders.push(path);
    }
  }
}

walk(".");

// Workflows must not invoke the .NET toolchain.
function checkWorkflows() {
  const workflowDir = ".github/workflows";
  let entries;
  try {
    entries = readdirSync(workflowDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(workflowDir, entry);
    const text = readFileSync(path, "utf8");
    if (/\bdotnet\b|setup-dotnet|msbuild/i.test(text)) {
      offenders.push(`${path} (references the .NET toolchain)`);
    }
  }
}

checkWorkflows();

if (offenders.length > 0) {
  console.error("serfbound-independence-failed: .NET artifacts found:");
  for (const offender of offenders) {
    console.error(`  - ${offender}`);
  }

  process.exit(1);
}

console.log("serfbound-independence-ok: zero .NET artifacts in the tree.");
