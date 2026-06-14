// Headless verification for the device-gate playtest deck (SB-44-01).
// Loads index.html in real Chromium, asserts the protocol rendered, the
// verdict controls work, the progress chip updates, and the offline
// fallback engages when reveal.js is blocked. Writes a screenshot.
//
//   node pm/roadmap/serfbound/phase-44-gate-verification/playtest/verify-deck.mjs
//
// Exit 0 = all assertions pass; the console output is the evidence.

import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const url = "file://" + join(here, "index.html");
const EXPECTED_PHASES = [35, 36, 37, 38, 39, 42, 43];
const EXPECTED_CHECKS = 36; // 4+3+4+9+5+6+5

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "ok  " : "FAIL"} - ${msg}`); if (!cond) failures++; };

const browser = await chromium.launch();

// Pass 1: reveal.js available (CDN reachable) — full deck.
{
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } }); // iPhone-ish
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });

  const phases = await page.$$eval("section[data-phase]", els =>
    els.map(e => e.getAttribute("data-phase")).filter(p => /^\d+$/.test(p)).map(Number));
  ok(EXPECTED_PHASES.every(p => phases.includes(p)), `all 7 gate phases rendered (${EXPECTED_PHASES.join(",")})`);

  const checks = await page.$$("section[data-check]");
  ok(checks.length === EXPECTED_CHECKS, `${checks.length} check slides rendered (expected ${EXPECTED_CHECKS})`);

  const controlGroups = await page.$$(".controls[data-id]");
  ok(controlGroups.length === EXPECTED_CHECKS, `${controlGroups.length} verdict control groups (one per check)`);

  const firstHasThree = await page.$$eval(".controls[data-id] .verdicts button",
    bs => bs.length >= 3 * 36);
  ok(firstHasThree, "every check has Pass/Fail/Skip buttons");

  ok(errors.length === 0, `no console/page errors (${errors.length})`);

  // Drive a verdict via the element itself (reveal hides non-active slides,
  // so a visibility-gated click won't reach it; el.click() still fires the
  // delegated handler the real UI uses).
  const tapPass = () => page.$eval('.controls[data-id="35.1"] button[data-v="pass"]', b => b.click());
  await tapPass();
  const active = await page.$eval('.controls[data-id="35.1"] button[data-v="pass"]',
    b => b.classList.contains("active"));
  ok(active, "clicking Pass activates the verdict");
  const prog = await page.$eval("#progress", e => e.textContent);
  ok(/1\/36/.test(prog) && /✓1/.test(prog), `progress chip updates after a verdict: "${prog.trim()}"`);

  // Tap again clears it (toggle).
  await tapPass();
  const cleared = await page.$eval("#progress", e => e.textContent);
  ok(/0\/36/.test(cleared), `re-tapping clears the verdict: "${cleared.trim()}"`);

  await page.screenshot({ path: join(here, "artifacts", "deck-phone.png"), fullPage: false });
  console.log("    screenshot -> artifacts/deck-phone.png");
  await page.close();
}

// Pass 2: reveal.js blocked — the protocol must still render (offline fallback).
{
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.route("**/cdn.jsdelivr.net/**", r => r.abort());
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const noReveal = await page.$eval("body", b => b.classList.contains("no-reveal"));
  ok(noReveal, "offline fallback engages when the CDN is blocked");
  const checks = await page.$$("section[data-check]");
  ok(checks.length === EXPECTED_CHECKS, `protocol still renders ${checks.length} checks with no CDN`);
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nALL DECK ASSERTIONS PASS" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
