// SB-32-01: token hygiene for the design standard
// (docs/design/design-standard.md §2/§7). Three checks:
//   1. Every token consumed in component CSS is defined in tokens.css.
//   2. Every defined token is either consumed or explicitly reserved
//      for a named upcoming story (the reserved list shrinks as
//      SB-32-02..04 land; an unused, unreserved token is dead canon).
//   3. Raw color literals in component CSS are a ratchet: the count
//      may only go down (SB-32-02 drives it to zero). New colors enter
//      tokens.css, never component CSS.

import { existsSync, readFileSync } from "node:fs";

const tokensCss = readFileSync("packages/app/src/tokens.css", "utf8");
const componentCss = readFileSync("packages/app/src/styles.css", "utf8");

// Ratchet: raw color literals still in styles.css awaiting
// conversion. SB-32-02 drove it to zero; it stays there.
const RAW_COLOR_RATCHET = 0;

// Tokens defined ahead of the surfaces that consume them. Empty as
// of SB-32-03 — every defined token is consumed.
const RESERVED = new Map([]);

const failures = [];

const defined = new Set(
  [...tokensCss.matchAll(/^\s*(--sb-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);
const consumed = new Set(
  [...componentCss.matchAll(/var\((--sb-[a-z0-9-]+)/g)].map((m) => m[1]),
);

for (const token of consumed) {
  if (!defined.has(token)) {
    failures.push(`consumed but undefined: ${token}`);
  }
}

for (const token of defined) {
  if (!consumed.has(token) && !RESERVED.has(token) && !tokensCss.includes(`var(${token}`)) {
    failures.push(`defined but never consumed (and not reserved): ${token}`);
  }
}

for (const [token, reason] of RESERVED) {
  if (!defined.has(token)) {
    failures.push(`reserved token missing from tokens.css: ${token} (${reason})`);
  }

  if (consumed.has(token)) {
    failures.push(`now consumed — remove from RESERVED: ${token}`);
  }
}

// Gump integrity (§7.5): every material the CSS references exists.
for (const match of componentCss.matchAll(/url\("\.\/(gumps\/[a-z-]+\.png)"\)/g)) {
  if (!existsSync(`packages/app/src/${match[1]}`)) {
    failures.push(`gump referenced but missing on disk: ${match[1]}`);
  }
}

const rawColors = [
  ...componentCss.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g),
].length;
if (rawColors > RAW_COLOR_RATCHET) {
  failures.push(
    `raw color literals in styles.css grew: ${rawColors} > ratchet ${RAW_COLOR_RATCHET} — new colors enter tokens.css`,
  );
}

if (failures.length > 0) {
  console.error("serfbound-design-tokens FAILED:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exit(1);
}

console.log(
  `serfbound-design-tokens-ok: ${defined.size} tokens defined, ${consumed.size} consumed, ` +
    `${RESERVED.size} reserved, raw-color ratchet ${rawColors}/${RAW_COLOR_RATCHET}.`,
);
