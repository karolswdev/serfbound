// SB-32-01: token hygiene for the design standard
// (docs/design/design-standard.md §2/§7). Three checks:
//   1. Every token consumed in component CSS is defined in tokens.css.
//   2. Every defined token is either consumed or explicitly reserved
//      for a named upcoming story (the reserved list shrinks as
//      SB-32-02..04 land; an unused, unreserved token is dead canon).
//   3. Raw color literals in component CSS are a ratchet: the count
//      may only go down (SB-32-02 drives it to zero). New colors enter
//      tokens.css, never component CSS.

import { readFileSync } from "node:fs";

const tokensCss = readFileSync("packages/app/src/tokens.css", "utf8");
const componentCss = readFileSync("packages/app/src/styles.css", "utf8");

// Ratchet: raw color literals still in styles.css awaiting SB-32-02
// conversion. Lower this number as they convert; never raise it.
const RAW_COLOR_RATCHET = 15;

// Tokens defined ahead of the surfaces that consume them.
const RESERVED = new Map([
  ["--sb-text-lg", "SB-32-02 section titles"],
  ["--sb-text-hero", "SB-32-02 wordmark"],
  ["--sb-text-xs", "SB-32-02 panel kickers"],
  ["--sb-text-md", "SB-32-02 panel values"],
  ["--sb-weight-body", "SB-32-02 body text"],
  ["--sb-track-wide", "SB-32-02 uppercase labels"],
  ["--sb-space-1", "SB-32-02 dense gaps"],
  ["--sb-space-5", "SB-32-02 panel padding"],
  ["--sb-space-6", "SB-32-02 scene padding"],
  ["--sb-radius-md", "SB-32-02 cards/panels"],
  ["--sb-radius-lg", "SB-32-02 canvas frame"],
  ["--sb-shadow-canvas", "SB-32-02 canvas frame"],
  ["--sb-shadow-card", "SB-32-04 lobby cards/toasts"],
  ["--sb-dur-slow", "SB-32-02 chrome state changes"],
  ["--sb-banner-red", "SB-32-03 error states"],
  ["--sb-meadow", "SB-32-04 your-turn badge"],
  ["--sb-surface", "SB-32-02 panel surfaces"],
  ["--sb-parchment-bright", "SB-32-02 headings/values"],
  ["--sb-moss", "SB-32-02 labels/details"],
]);

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
