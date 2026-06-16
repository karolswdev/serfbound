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
  // Keep the deck hermetic: stub the rig manifest (empty here) so the test
  // never depends on the live game origin. Empty = no rig buttons, the
  // graceful-degrade path.
  await page.route("**/rigs/manifest.json", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      body: "{}",
    }),
  );
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

// Pass 3: capture layer (SB-44-02) — persistence across reload + report.
{
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("serfbound-gate-playtest-v1"));

  await page.$eval('.controls[data-id="35.1"] button[data-v="pass"]', b => b.click());
  await page.$eval('.notes[data-id="35.1"]', t => {
    t.value = "clean walk"; t.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.reload({ waitUntil: "networkidle" });   // the app-switch-back scenario
  const persisted = await page.$eval('.controls[data-id="35.1"] button[data-v="pass"]', b => b.classList.contains("active"));
  ok(persisted, "verdict persists across reload (localStorage)");
  const note = await page.$eval('.notes[data-id="35.1"]', t => t.value);
  ok(note === "clean walk", `note persists across reload: "${note}"`);
  const resumeShown = await page.$eval("#resume", e => e.style.display !== "none");
  ok(resumeShown, "resume banner shows after a restore");

  const report = await page.$eval("#report", e => e.textContent);
  ok(/\[35\.1\] ✓ pass/.test(report), "report records the verdict");
  ok(/note: clean walk/.test(report), "report carries the note");
  ok(/Phase 35 — Locomotion fidelity/.test(report) && /Verdict:/.test(report), "report groups by phase with a roll-up verdict");

  await page.evaluate(() => { window.confirm = () => true; });
  await page.$eval("#reset-report", b => b.click());
  const afterReset = await page.$eval("#progress", e => e.textContent);
  ok(/0\/36/.test(afterReset), "reset clears all verdicts");
  const cleared = await page.evaluate(() => localStorage.getItem("serfbound-gate-playtest-v1"));
  ok(!cleared, "reset clears persisted storage");
  await page.close();
}

// Pass 4: rig launch + shared-store reflection (SB-44-03). With a manifest
// present, each covered check gains a deep-link button; a verdict written to
// the shared store (as the in-game HUD does) reflects in the deck on focus.
{
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.route("**/rigs/manifest.json", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      body: JSON.stringify({
        schemaVersion: 1,
        kind: "serfbound.rig-manifest",
        rigs: [
          {
            id: "phase-36-road-split",
            gate: "SB-36-06",
            check: "36.1",
            covers: ["36.1"],
            kind: "local-game",
            title: "Split a live road",
            instruction: "Plant a flag in the middle of the road.",
            result: "Both halves staff themselves.",
            deepLink: "?rig=phase-36-road-split",
          },
        ],
        byCheck: { "36.1": "phase-36-road-split" },
      }),
    }),
  );
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("serfbound-gate-playtest-v1"));
  await page.waitForSelector('section[data-check="36.1"] .rig-launch button.rig-open', { timeout: 5000 }).catch(() => {});

  const hasOpen = await page.$('section[data-check="36.1"] .rig-launch button.rig-open');
  ok(hasOpen !== null, "rig 'Open rig here' button injected on the check");
  // Single source: the launch panel must NOT repeat the instruction/result —
  // the slide's own do/watch/pass is the one guidance.
  const repeated = await page.$('section[data-check="36.1"] .rig-launch .rig-do, section[data-check="36.1"] .rig-launch .rig-expect');
  ok(repeated === null, "the rig panel does not repeat the check's instruction (single source)");
  const ownDo = await page.$eval('section[data-check="36.1"] .do', (p) => p.textContent).catch(() => "");
  ok(ownDo.trim().length > 0, "the check slide carries its own do/guidance");

  // Split-screen: clicking it loads the rig into the game iframe and splits.
  await page.$eval('section[data-check="36.1"] .rig-launch button.rig-open', (b) => b.click());
  const split = await page.$eval("body", (b) => b.classList.contains("split"));
  ok(split, "clicking a rig splits the window (game panel shown)");
  const frameSrc = await page.$eval("#rig-frame", (f) => f.getAttribute("src"));
  ok(!!frameSrc && /\?rig=phase-36-road-split/.test(frameSrc), `game iframe loads the rig: ${frameSrc}`);
  const popout = await page.$eval("#game-popout", (a) => a.getAttribute("href"));
  ok(!!popout && /\?rig=phase-36-road-split/.test(popout), "pop-out link points at the rig");
  await page.$eval("#game-close", (b) => b.click());
  const closed = await page.$eval("body", (b) => !b.classList.contains("split"));
  ok(closed, "closing the panel un-splits the window");

  // A check WITHOUT a manifest entry stays a plain checklist item (no button).
  const unrigged = await page.$('section[data-check="42.4"] .rig-launch');
  ok(unrigged === null, "a check with no rig stays a plain checklist item");

  await page.evaluate(() => {
    localStorage.setItem(
      "serfbound-gate-playtest-v1",
      JSON.stringify({ "36.1": { status: "pass", notes: "in-game capture" } }),
    );
    window.dispatchEvent(new Event("focus"));
  });
  const reflected = await page.$eval(
    '.controls[data-id="36.1"] button[data-v="pass"]',
    (b) => b.classList.contains("active"),
  );
  ok(reflected, "a verdict in the shared store reflects in the deck on focus");
  const report = await page.$eval("#report", (e) => e.textContent);
  ok(/\[36\.1\] ✓ pass/.test(report), "in-game verdict flows into the hand-back report");
  await page.close();
}

// Pass 5: auto-advance (SB-44-11) — recording a verdict on a check slide
// steps the deck to the next check.
{
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("serfbound-gate-playtest-v1"));
  // Land on the first check slide via reveal's own indices for that element.
  await page.evaluate(() => {
    const el = document.querySelector('section[data-check="35.1"]');
    const i = Reveal.getIndices(el);
    Reveal.slide(i.h, i.v);
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => Reveal.getCurrentSlide()?.getAttribute("data-check"));
  ok(before === "35.1", `navigated to the check slide: ${before}`);
  if (before) {
    await page.$eval(`section[data-check="${before}"] button[data-v="pass"]`, (b) => b.click());
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => Reveal.getCurrentSlide()?.getAttribute("data-check"));
    ok(after !== before, `recording a verdict auto-advances off ${before} (now ${after})`);
  }
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nALL DECK ASSERTIONS PASS" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
