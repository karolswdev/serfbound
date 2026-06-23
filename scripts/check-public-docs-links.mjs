import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const docsToCheck = ["README.md", "CONTRIBUTING.md"];
const markdownLinkPattern = /!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const referenceLinkPattern = /^\s*\[[^\]]+\]:\s*(\S+)/gm;
const localMediaPattern = /docs\/media\/([A-Za-z0-9._-]+\.(?:png|gif|jpg|jpeg|webp))/g;

const failures = [];
let localTargets = 0;
let externalTargets = 0;

for (const docPath of docsToCheck) {
  const absDocPath = resolve(workspaceRoot, docPath);
  const text = readFileSync(absDocPath, "utf8");
  const urls = [
    ...extractMatches(text, markdownLinkPattern),
    ...extractMatches(text, referenceLinkPattern),
    ...extractMediaReferences(text),
  ];

  for (const rawUrl of urls) {
    const url = stripAngleBrackets(rawUrl.trim());
    if (url === "" || url.startsWith("#")) {
      continue;
    }

    if (isExternalUrl(url)) {
      validateExternalUrl(docPath, url);
      externalTargets += 1;
    } else {
      validateLocalTarget(docPath, url);
      localTargets += 1;
    }
  }
}

if (failures.length > 0) {
  console.error("serfbound-public-doc-links FAILED:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `serfbound-public-doc-links-ok: ${localTargets} local targets and ${externalTargets} external URLs in README/CONTRIBUTING.`,
);

function extractMatches(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

function extractMediaReferences(text) {
  return [...text.matchAll(localMediaPattern)].map((match) => `docs/media/${match[1]}`);
}

function stripAngleBrackets(value) {
  if (value.startsWith("<") && value.endsWith(">")) {
    return value.slice(1, -1);
  }
  return value;
}

function isExternalUrl(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url);
}

function validateExternalUrl(docPath, url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      failures.push(`${docPath}: unsupported URL scheme in ${url}`);
    }
  } catch {
    failures.push(`${docPath}: invalid external URL ${url}`);
  }
}

function validateLocalTarget(docPath, url) {
  const [pathPart, fragmentPart] = splitLocalUrl(url);
  const decodedPath = decodePath(docPath, pathPart);
  if (decodedPath === null) {
    return;
  }

  const baseDir = dirname(resolve(workspaceRoot, docPath));
  const targetPath = pathPart === "" ? resolve(workspaceRoot, docPath) : resolve(baseDir, decodedPath);
  const rootRelative = relative(workspaceRoot, targetPath);

  if (rootRelative.startsWith("..") || isAbsolute(rootRelative)) {
    failures.push(`${docPath}: local link escapes repository: ${url}`);
    return;
  }

  if (!existsSync(targetPath)) {
    failures.push(`${docPath}: missing local link target: ${url}`);
    return;
  }

  if (fragmentPart && statSync(targetPath).isFile() && targetPath.endsWith(".md")) {
    validateMarkdownFragment(docPath, url, targetPath, fragmentPart);
  }
}

function splitLocalUrl(url) {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) {
    return [url, ""];
  }
  return [url.slice(0, hashIndex), url.slice(hashIndex + 1)];
}

function decodePath(docPath, pathPart) {
  try {
    return decodeURIComponent(pathPart);
  } catch {
    failures.push(`${docPath}: malformed URL encoding in ${pathPart}`);
    return null;
  }
}

function validateMarkdownFragment(docPath, url, targetPath, fragmentPart) {
  const expected = fragmentPart.toLowerCase();
  const targetText = readFileSync(targetPath, "utf8");
  const slugs = new Set();

  for (const line of targetText.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (!heading) {
      continue;
    }
    slugs.add(slugifyHeading(heading[2]));
  }

  if (!slugs.has(expected)) {
    failures.push(`${docPath}: missing markdown heading fragment ${url}`);
  }
}

function slugifyHeading(headingText) {
  return normalize(headingText)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}
