import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import {
  convertDosPaArchiveToLicensedAssetPackage,
  inspectLicensedAssetPackageBytes,
  verifyLicensedAssetPackageBytes,
} from "../packages/assets/dist/index.js";

const args = parseArgs(process.argv.slice(2));

if (args.help || (args.inspect === undefined && (args.input === undefined || args.output === undefined))) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

if (args.inspect !== undefined) {
  const bytes = readFileSync(args.inspect);
  const inspection = verifyLicensedAssetPackageBytes(bytes);
  console.log(JSON.stringify(inspection, null, 2));
  process.exit(0);
}

const inputPath = requireArg(args.input, "--input");
const outputPath = requireArg(args.output, "--output");
const sourceBytes = readFileSync(inputPath);
const converted = convertDosPaArchiveToLicensedAssetPackage(sourceBytes, {
  archiveName: args.archiveName ?? basename(inputPath),
});
writeFileSync(outputPath, converted.bytes);

const inspection = inspectLicensedAssetPackageBytes(converted.bytes);
console.log(
  JSON.stringify(
    {
      output: outputPath,
      packageChecksum: converted.packageChecksum,
      inspection,
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--input":
        parsed.input = argv[++index];
        break;
      case "--output":
        parsed.output = argv[++index];
        break;
      case "--archive-name":
        parsed.archiveName = argv[++index];
        break;
      case "--inspect":
        parsed.inspect = argv[++index];
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function requireArg(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function printUsage() {
  console.log(`Usage:
  npm run build
  node scripts/convert-licensed-assets.mjs --input path/to/SPAU.PA --output .tmp/serfbound-assets.sb31.json
  node scripts/convert-licensed-assets.mjs --inspect .tmp/serfbound-assets.sb31.json

Options:
  --archive-name NAME   Source archive name recorded in package provenance.
  --inspect PATH        Inspect and verify an existing package.
`);
}
