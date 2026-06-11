import { mapCharacterToGlyphIndex } from "@serfbound/assets";

// In-game strings (SB-26-03): every text the game font renders comes
// from one keyed table per language. English is the reference; German
// proves the path (and fits the original glyph set's umlauts). The
// templates substitute {param} placeholders; everything still renders
// through the decoded font + shadow pipeline.

export type UiLanguage = "en" | "de";

export const uiLanguages: readonly UiLanguage[] = ["en", "de"];

const tables = {
  en: {
    "hud.stock": "PLANK:{planks} STONE:{stones}",
    "sett.knights": "KNIGHTS",
    "sett.threatRow": "THREAT {threat} LEVEL {level}",
    "sett.morale": "MORALE {morale}",
    "sett.audio": "SFX {sfx} MUSIC {music}",
    "audio.on": "ON",
    "audio.off": "OFF",
    "init.title": "SERFBOUND",
    "init.seed": "SEED",
    "init.supplies": "SUPPLIES {value}",
    "init.mapSize": "MAP SIZE {value}",
    "init.mission": "MISSION {value}",
    "init.missionCustom": "CUSTOM",
    "init.start": "START",
    "notice.buildingComplete": "BUILDING COMPLETE",
    "notice.gameOver": "GAME OVER",
    "notice.achievement": "DEED DONE - {name}",
    "notice.waiting": "WAITING FOR OPPONENT",
    "notice.moveArrived": "OPPONENT MOVED - PRESS ENTER",
    "notice.recapWatching": "RECAP - WATCHING",
    "notice.yourWindow": "YOUR WINDOW",
    "notice.hotseatPickup": "PLAYER {player} PRESS ENTER - {seconds}",
    "notice.hotseatRecap": "RECAP - PLAYER {player} WATCHES",
    "notice.hotseatYourWindow": "PLAYER {player} - YOUR WINDOW",
    "notice.castleConfirm": "TAP THE SAME TILE TO FOUND",
    "notice.roadPickStart": "TAP YOUR STARTING FLAG",
    "notice.roadExtendHint": "TAP TO EXTEND THE ROAD",
    "notice.roadFlagHint": "TAP THE END TO RAISE A FLAG",
    "notice.roadNoPath": "NO PATH THAT WAY",
    "notice.roadBuilt": "THE ROAD IS LAID",
    "notice.roadFailed": "NO ROAD - END AT A FLAG",
    "notice.roadEnded": "ROAD MODE ENDED",
    "digest.header": "WINDOW {window} - PLAYER {player} MOVED",
    "digest.seat": "P{player}:",
    "digest.quiet": "QUIET",
    "digest.built": "BLD {value}",
    "digest.completed": "DONE {value}",
    "digest.flags": "FLAGS {value}",
    "digest.land": "LAND {value}",
    "digest.stock": "STOCK {value}",
    "digest.serfs": "SERFS {value}",
  },
  de: {
    "hud.stock": "BRETT:{planks} STEIN:{stones}",
    "sett.knights": "RITTER",
    "sett.threatRow": "GEFAHR {threat} STUFE {level}",
    "sett.morale": "MORAL {morale}",
    "sett.audio": "TON {sfx} MUSIK {music}",
    "audio.on": "AN",
    "audio.off": "AUS",
    "init.title": "SERFBOUND",
    "init.seed": "STARTWERT",
    "init.supplies": "VORRAT {value}",
    "init.mapSize": "KARTE {value}",
    "init.mission": "MISSION {value}",
    "init.missionCustom": "FREI",
    "init.start": "START",
    "notice.buildingComplete": "GEBÄUDE FERTIG",
    "notice.gameOver": "SPIEL VORBEI",
    "notice.achievement": "TAT VOLLBRACHT - {name}",
    "notice.waiting": "WARTE AUF GEGNER",
    "notice.moveArrived": "GEGNER ZOG - ENTER DRÜCKEN",
    "notice.recapWatching": "RÜCKBLICK LÄUFT",
    "notice.yourWindow": "DEIN ZUG",
    "notice.hotseatPickup": "SPIELER {player} ENTER - {seconds}",
    "notice.hotseatRecap": "RÜCKBLICK - SPIELER {player} SIEHT ZU",
    "notice.hotseatYourWindow": "SPIELER {player} - DEIN ZUG",
    "notice.castleConfirm": "GLEICHES FELD TIPPEN ZUM GRÜNDEN",
    "notice.roadPickStart": "STARTFAHNE ANTIPPEN",
    "notice.roadExtendHint": "TIPPEN UM DEN WEG ZU VERLÄNGERN",
    "notice.roadFlagHint": "ENDE TIPPEN - FAHNE SETZEN",
    "notice.roadNoPath": "DORT FÜHRT KEIN WEG HIN",
    "notice.roadBuilt": "DER WEG IST GELEGT",
    "notice.roadFailed": "KEIN WEG - AN FAHNE ENDEN",
    "notice.roadEnded": "WEGBAU BEENDET",
    "digest.header": "ZUG {window} - SPIELER {player} ZOG",
    "digest.seat": "P{player}:",
    "digest.quiet": "RUHIG",
    "digest.built": "BAU {value}",
    "digest.completed": "FERTIG {value}",
    "digest.flags": "FAHNEN {value}",
    "digest.land": "LAND {value}",
    "digest.stock": "LAGER {value}",
    "digest.serfs": "SERFS {value}",
  },
} as const satisfies Record<UiLanguage, Record<string, string>>;

export type UiStringKey = keyof (typeof tables)["en"];

let currentLanguage: UiLanguage = "en";

export function setUiLanguage(language: UiLanguage): void {
  currentLanguage = language;
}

export function getUiLanguage(): UiLanguage {
  return currentLanguage;
}

export function uiText(
  key: UiStringKey,
  params?: Record<string, string | number>,
): string {
  let text: string = tables[currentLanguage][key];
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replaceAll(`{${name}}`, String(value));
  }

  return text;
}

// Glyph coverage is a build/test failure, not a runtime blank: every
// character of every entry (placeholders aside) must map to a real
// glyph in the original font.
export function uiTableGlyphOffenders(language: UiLanguage): string[] {
  const offenders: string[] = [];
  for (const [key, template] of Object.entries(tables[language])) {
    const withoutPlaceholders = template.replace(/\{[a-z]+\}/gi, "0");
    for (const character of withoutPlaceholders) {
      if (character === " ") {
        continue;
      }

      if (mapCharacterToGlyphIndex(character) === 42 && character !== "?") {
        offenders.push(`${language}.${key}: '${character}'`);
      }
    }
  }

  return offenders;
}
