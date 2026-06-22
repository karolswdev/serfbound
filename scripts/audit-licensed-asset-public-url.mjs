import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  fail(errorMessage(error));
}
const baseUrl = normalizeBaseUrl(
  args.base ?? process.env["SERFBOUND_PUBLIC_URL"] ?? "https://serfbound.com",
);
const manifestUrl = new URL("licensed-assets/manifest.json", baseUrl);
const assetsModulePath = join(workspaceRoot, "packages/assets/dist/index.js");

if (!existsSync(assetsModulePath)) {
  fail("packages/assets/dist is missing; run npm run build first.");
}

const {
  decodeLicensedAssetPackageBytes,
  licensedAssetPackageChecksumAlgorithm,
  licensedAssetPackageFormatVersion,
  verifyLicensedAssetPackageBytes,
} = await import(pathToFileURL(assetsModulePath));

try {
  assertHttpsOrLocal(manifestUrl, "manifest");
  const manifest = await loadManifest(manifestUrl);
  const packageUrl = new URL(manifest.packageUrl, manifestUrl);
  assertHttpsOrLocal(packageUrl, "package");

  const packageResponse = await fetchOk(packageUrl, "licensed package");
  const packageBytes = new Uint8Array(await packageResponse.arrayBuffer());
  const inspection = verifyLicensedAssetPackageBytes(packageBytes);
  const licensedPackage = decodeLicensedAssetPackageBytes(packageBytes);
  const publicViolations = await rawArchivePublicProbes(baseUrl);

  const violations = [
    ...validateManifest(manifest),
    ...validatePackage(manifest, licensedPackage, inspection),
    ...publicViolations,
  ];
  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }

  console.log(
    [
      "serfbound-public-licensed-asset-audit-ok",
      `manifest=${manifestUrl.href}`,
      `package=${packageUrl.href}`,
      `packageChecksum=${inspection.packageChecksum.algorithm}:${inspection.packageChecksum.value}`,
      `sourceChecksum=${inspection.sourceChecksum.algorithm}:${inspection.sourceChecksum.value}`,
      `archiveName=${inspection.archiveName}`,
      `byteLength=${inspection.byteLength}`,
      `resources=${inspection.resourceCount}`,
      `sprites=${inspection.spriteCount}`,
      `sfx=${inspection.sfxCount}`,
      `music=${inspection.musicTrackCount}`,
    ].join(" "),
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

async function loadManifest(url) {
  const response = await fetchOk(url, "licensed asset manifest");
  let parsed;
  try {
    parsed = JSON.parse(await response.text());
  } catch (error) {
    throw new Error(`licensed asset manifest is not valid JSON at ${url.href}: ${errorMessage(error)}`);
  }

  return parsed;
}

function validateManifest(manifest) {
  const violations = [];
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["licensed asset manifest must be a JSON object."];
  }

  if (manifest.kind !== "serfbound.licensed-asset-delivery") {
    violations.push("manifest kind must be serfbound.licensed-asset-delivery.");
  }
  if (manifest.schemaVersion !== 1) {
    violations.push("manifest schemaVersion must be 1.");
  }
  if (manifest.formatVersion !== licensedAssetPackageFormatVersion) {
    violations.push(`manifest formatVersion must be ${licensedAssetPackageFormatVersion}.`);
  }
  if (manifest.permissionRecord !== "LICENSE-CONSENT.md") {
    violations.push("manifest permissionRecord must be LICENSE-CONSENT.md.");
  }
  if (manifest.pmoStory !== "SB-31-01") {
    violations.push("manifest pmoStory must be SB-31-01.");
  }
  if (typeof manifest.packageUrl !== "string" || manifest.packageUrl.trim() === "") {
    violations.push("manifest packageUrl must be a non-empty string.");
  }
  violations.push(...validateChecksum(manifest.packageChecksum, "manifest packageChecksum"));

  return violations;
}

function validatePackage(manifest, licensedPackage, inspection) {
  const violations = [];
  if (!checksumsEqual(manifest.packageChecksum, inspection.packageChecksum)) {
    violations.push(
      `manifest packageChecksum ${checksumLabel(manifest.packageChecksum)} does not match package ${checksumLabel(inspection.packageChecksum)}.`,
    );
  }
  if (licensedPackage.permission?.recordPath !== "LICENSE-CONSENT.md") {
    violations.push("package permission.recordPath must be LICENSE-CONSENT.md.");
  }
  if (licensedPackage.permission?.pmoStory !== "SB-31-01") {
    violations.push("package permission.pmoStory must be SB-31-01.");
  }
  if (licensedPackage.permission?.scope !== "converted-browser-runtime-package") {
    violations.push("package permission.scope must be converted-browser-runtime-package.");
  }
  if (
    typeof licensedPackage.licenseNote !== "string" ||
    !licensedPackage.licenseNote.includes("LICENSE-CONSENT.md") ||
    !licensedPackage.licenseNote.toLowerCase().includes("raw original archives")
  ) {
    violations.push("package licenseNote must cite LICENSE-CONSENT.md and the raw-archive boundary.");
  }
  if (licensedPackage.formatVersion !== licensedAssetPackageFormatVersion) {
    violations.push(`package formatVersion must be ${licensedAssetPackageFormatVersion}.`);
  }
  if (!inspection.contentChecksumValid) {
    violations.push("package content checksum must be valid.");
  }

  return violations;
}

async function rawArchivePublicProbes(base) {
  const violations = [];
  for (const path of ["SPAU.PA", "SOUNDS.PA", "SERF.EXE", "licensed-assets/SPAU.PA", "licensed-assets/SOUNDS.PA"]) {
    const url = new URL(path, base);
    let response;
    try {
      response = await fetch(url, { cache: "no-store" });
    } catch {
      continue;
    }
    if (!response.ok) {
      continue;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const textProbe = new TextDecoder().decode(bytes.slice(0, 512)).toLowerCase();
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const looksLikeHtml =
      contentType.includes("text/html") ||
      textProbe.includes("<!doctype html") ||
      textProbe.includes("<html");
    if (!looksLikeHtml) {
      violations.push(`${url.href} responded with non-HTML content; raw original archive probes must not be served.`);
    }
  }

  return violations;
}

function validateChecksum(checksum, label) {
  if (checksum === null || typeof checksum !== "object" || Array.isArray(checksum)) {
    return [`${label} must be an object.`];
  }
  const violations = [];
  if (checksum.algorithm !== licensedAssetPackageChecksumAlgorithm) {
    violations.push(`${label}.algorithm must be ${licensedAssetPackageChecksumAlgorithm}.`);
  }
  if (typeof checksum.value !== "string" || !/^[0-9a-f]{8}$/u.test(checksum.value)) {
    violations.push(`${label}.value must be an 8-digit lowercase hex checksum.`);
  }
  return violations;
}

function checksumsEqual(left, right) {
  return (
    left !== null &&
    right !== null &&
    typeof left === "object" &&
    typeof right === "object" &&
    left.algorithm === right.algorithm &&
    left.value === right.value
  );
}

function checksumLabel(checksum) {
  if (checksum === null || typeof checksum !== "object") {
    return String(checksum);
  }
  return `${checksum.algorithm}:${checksum.value}`;
}

async function fetchOk(url, label) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${label} failed at ${url.href}: HTTP ${response.status}`);
  }
  return response;
}

function assertHttpsOrLocal(url, label) {
  if (url.protocol === "https:" || isLocalhost(url.hostname)) {
    return;
  }

  throw new Error(`${label} URL must use HTTPS outside localhost: ${url.href}`);
}

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeBaseUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    url = new URL(`https://${input}`);
  }
  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  return url;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--base":
        parsed.base = argv[++index];
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (parsed.help) {
    console.log(`Usage:
  npm run audit:licensed-assets:public -- --base https://serfbound.com

Options:
  --base URL   Public origin or mounted app URL. Defaults to SERFBOUND_PUBLIC_URL or https://serfbound.com.
`);
    process.exit(0);
  }

  return parsed;
}

function fail(message) {
  console.error(`serfbound-public-licensed-asset-audit-failed: ${message}`);
  process.exit(1);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
