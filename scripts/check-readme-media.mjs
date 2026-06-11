// SB-28-01: media integrity, CI-safe. Every docs/media reference in
// the README resolves to a committed file, every committed media file
// is referenced (no orphan weight), and the set stays inside the
// recorded size budget.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

// The recorded budget for the whole committed media set.
const SIZE_BUDGET_BYTES = 1_500_000;

const failures = [];
const readme = readFileSync("README.md", "utf8");
const referenced = new Set(
  [...readme.matchAll(/docs\/media\/([a-z0-9.-]+\.(?:png|gif))/g)].map((match) => match[1]),
);

for (const name of referenced) {
  if (!existsSync(`docs/media/${name}`)) {
    failures.push(`README references missing media: docs/media/${name}`);
  }
}

let totalBytes = 0;
const committed = existsSync("docs/media") ? readdirSync("docs/media") : [];
for (const name of committed) {
  totalBytes += statSync(`docs/media/${name}`).size;
  if (!referenced.has(name) && name !== "README.md") {
    failures.push(`committed media never referenced by the README: docs/media/${name}`);
  }
}

if (totalBytes > SIZE_BUDGET_BYTES) {
  failures.push(
    `media set exceeds the recorded budget: ${totalBytes} > ${SIZE_BUDGET_BYTES} bytes`,
  );
}

if (failures.length > 0) {
  console.error("serfbound-readme-media-check FAILED:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exit(1);
}

console.log(
  `serfbound-readme-media-check-ok: ${referenced.size} referenced, ` +
    `${committed.length} committed, ${Math.round(totalBytes / 1024)}KB of ${Math.round(SIZE_BUDGET_BYTES / 1024)}KB budget.`,
);
