import assert from "node:assert/strict";
import { test, afterEach } from "node:test";

import {
  digestLines,
  getUiLanguage,
  setUiLanguage,
  uiLanguages,
  uiTableGlyphOffenders,
  uiText,
} from "@serfbound/app";

// SB-26-03: the in-game string tables — English as the reference,
// German proving the path, every entry inside the original font's
// glyph coverage.

afterEach(() => setUiLanguage("en"));

test("english renders identically to the previous inline strings", () => {
  assert.equal(getUiLanguage(), "en");
  assert.equal(uiText("hud.stock", { planks: 40, stones: 30 }), "PLANK:40 STONE:30");
  assert.equal(uiText("sett.threatRow", { threat: 2, level: 3 }), "THREAT 2 LEVEL 3");
  assert.equal(
    uiText("sett.audio", { sfx: uiText("audio.on"), music: uiText("audio.off") }),
    "SFX ON MUSIC OFF",
  );
  assert.equal(uiText("init.mission", { value: uiText("init.missionCustom") }), "MISSION CUSTOM");
  assert.equal(uiText("notice.buildingComplete"), "BUILDING COMPLETE");
  assert.equal(
    uiText("notice.hotseatPickup", { player: 2, seconds: 60 }),
    "PLAYER 2 PRESS ENTER - 60",
  );
});

test("the german table is complete and translates the whole surface", () => {
  setUiLanguage("de");
  assert.equal(uiText("hud.stock", { planks: 40, stones: 30 }), "BRETT:40 STEIN:30");
  assert.equal(uiText("sett.knights"), "RITTER");
  assert.equal(uiText("notice.buildingComplete"), "GEBÄUDE FERTIG");
  assert.equal(uiText("notice.moveArrived"), "GEGNER ZOG - ENTER DRÜCKEN");
  assert.equal(uiText("init.mission", { value: uiText("init.missionCustom") }), "MISSION FREI");

  // The digest speaks German too.
  const lines = digestLines({
    window: 0,
    activePlayer: 0,
    players: [
      {
        player: 0,
        buildingsCompleted: 0,
        buildingsStarted: 1,
        flagsBuilt: 0,
        landAreaDelta: 12,
        stockDelta: 0,
        serfsDelta: 0,
      },
    ],
  });
  assert.equal(lines[0], "ZUG 1 - SPIELER 1 ZOG");
  assert.equal(lines[1], "P1: BAU 1 LAND 12");
});

test("every table entry renders inside the original glyph set", () => {
  for (const language of uiLanguages) {
    assert.deepEqual(
      uiTableGlyphOffenders(language),
      [],
      `${language} fits the font (A-Z, digits, umlauts, symbols)`,
    );
  }
});
