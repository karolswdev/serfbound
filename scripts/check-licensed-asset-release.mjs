import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const violations = [];

const consentPath = join(workspaceRoot, "LICENSE-CONSENT.md");
const boundaryPath = join(
  workspaceRoot,
  "pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md",
);

if (!existsSync(consentPath)) {
  violations.push("LICENSE-CONSENT.md is required for licensed asset delivery.");
} else {
  const consent = readFileSync(consentPath, "utf8");
  for (const required of ["SB-31-01", "convert", "host"]) {
    if (!consent.toLowerCase().includes(required.toLowerCase())) {
      violations.push(`LICENSE-CONSENT.md is missing required consent marker: ${required}`);
    }
  }
}

if (!existsSync(boundaryPath)) {
  violations.push("asset-and-legal-boundary.md is required for licensed asset delivery.");
} else {
  const boundary = readFileSync(boundaryPath, "utf8");
  for (const required of ["licensed converted runtime packages", "raw original archives"]) {
    if (!boundary.toLowerCase().includes(required.toLowerCase())) {
      violations.push(`asset-and-legal-boundary.md is missing required boundary marker: ${required}`);
    }
  }
}

const forbiddenRawArtifactPattern =
  /(^|[/\\])(?:SPA[A-Z]?\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf|.*\.exe)(?:[/\\]|$)/i;
for (const rootName of ["public", "deploy", "dist"]) {
  const root = join(workspaceRoot, rootName);
  if (!existsSync(root)) {
    continue;
  }

  for (const file of walkFiles(root)) {
    const artifactPath = relative(root, file);
    if (forbiddenRawArtifactPattern.test(artifactPath)) {
      violations.push(`${rootName}/${artifactPath}: raw original asset/runtime file is forbidden.`);
    }
  }
}

const packageCandidates = [
  ...licensedPackageCandidates(join(workspaceRoot, "public")),
  ...licensedPackageCandidates(join(workspaceRoot, "dist")),
];
if (packageCandidates.length > 0) {
  const { verifyLicensedAssetPackageBytes } = await import(
    pathToFileURL(join(workspaceRoot, "packages/assets/dist/index.js"))
  );
  for (const file of packageCandidates) {
    try {
      const inspection = verifyLicensedAssetPackageBytes(readFileSync(file));
      if (!inspection.contentChecksumValid) {
        violations.push(`${relative(workspaceRoot, file)}: content checksum mismatch.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      violations.push(`${relative(workspaceRoot, file)}: invalid licensed package: ${message}`);
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log(
  `serfbound-licensed-asset-release-ok: consent/boundary present, raw archives absent, ${packageCandidates.length} hosted package artifact(s) verified.`,
);

function walkFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...walkFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function licensedPackageCandidates(root) {
  if (!existsSync(root)) {
    return [];
  }

  return walkFiles(root).filter((file) =>
    /(^|[/\\])licensed-assets[/\\].*\.sb31\.json$/i.test(relative(root, file)),
  );
}
