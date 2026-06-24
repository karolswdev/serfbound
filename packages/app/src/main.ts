import {
  assetImportBoundary,
  buildTypedAssetCatalog,
  parseDosPaCatalog,
  sfxType,
  validateArchiveFileSelection,
  type ArchiveValidationResult,
  type DosPaCatalog,
  type LicensedAssetPackage,
  type TypedAssetCatalog,
} from "@serfbound/assets";
import { PointerGestureTracker } from "./gestures.js";
import { workActionSound } from "./work-sounds.js";
import { mapTileToScreen } from "./landscape-scene.js";
import { SerfboundLoopbackMultiplayer } from "./multiplayer.js";
import { HotseatController } from "./hotseat.js";
import { SerfboundAsyncLoopbackMatch } from "./async-match.js";
import {
  BrowserIndexedDbProfileStore,
  createProfile,
  withAccount,
  withAvatar,
  withGuild,
  withAchievement,
  withMatchHistoryEntry,
  withMissionCompleted,
  withProfileName,
  type StoredSerfboundProfile,
} from "./profile-store.js";
import { avatarById, guildById, serfboundAvatars, serfboundGuilds } from "./identity-art.js";
import { deriveProfileStatistics, matchModeLabels } from "./profile-stats.js";
import {
  achievementById,
  evaluateAchievements,
  type AchievementFacts,
} from "./achievements.js";
import { resolveOnlineConfig } from "./online-config.js";
import { SerfboundOnlineSurface } from "./online-surface.js";
import { SerfboundOnlineMatch } from "./online-match.js";
import {
  IdentityV2ServiceError,
  createPasswordIdentityV2Account,
  signInPasswordIdentityV2,
  type IdentityV2Account,
} from "./identity-v2-client.js";
import type { MailboxMatchView } from "./mailbox-client.js";
import { digestLines } from "./recap.js";
import { getUiLanguage, setUiLanguage, uiText } from "./strings.js";
export * from "./strings.js";
import {
  SerfboundAiPlayer,
  buildingType,
  engineBoundary,
  findSerfboundMission,
  findShortestRoad,
  serfBodyOffset,
  serfboundMissions,
  startSerfboundMission,
  decodeCustomMapLandscape,
  restoreSerfboundLocalGame,
  SerfboundCommandRouter,
  startSerfboundLocalGame,
  uint16,
  type SerfboundBuiltStructure,
  type SerfboundCommandResult,
  type SerfboundLocalGame,
  type SerfboundLocalGameDataSource,
  type SerfboundCustomMap,
  type SerfboundLocalGameSnapshot,
  type SerfboundLocalGameStartResult,
  type SerfboundLocalGameStarted,
} from "@serfbound/engine";
import {
  BrowserIndexedDbImportedArchiveStore,
  InvalidStoredImportedArchiveRecordError,
  clearImportedArchiveRecord,
  createStoredImportedArchiveRecord,
  errorMessage,
  saveImportedArchiveRecord,
  type ImportedArchiveStore,
  type StoredImportedArchiveRecord,
} from "./imported-data-store.js";
import {
  BrowserIndexedDbLocalGameSaveStore,
  InvalidStoredLocalGameSaveRecordError,
  clearLocalGameSaveRecord,
  createStoredLocalGameSaveRecord,
  saveLocalGameSaveRecord,
  type LocalGameSaveStore,
  type StoredLocalGameSaveRecord,
} from "./local-game-save-store.js";
import {
  BrowserIndexedDbLicensedAssetPackageStore,
  clearLicensedAssetPackageRecord,
  loadLicensedAssetPackage,
  resolveLicensedAssetDeliveryConfig,
  resolveLicensedAssetDeliveryManifest,
  type LicensedAssetDeliveryConfig,
  type LicensedAssetFetch,
  type LicensedAssetPackageStore,
  type StoredLicensedAssetPackageRecord,
} from "./licensed-asset-delivery.js";
import {
  BrowserIndexedDbCommunityMapLibraryStore,
  createStoredCommunityMapRecord,
  saveCommunityMapRecord,
  type StoredCommunityMapRecord,
} from "./community-map-library-store.js";
import {
  fetchMap,
  listMaps,
  publishMap,
  publishMapWithIdentityV2,
  rateMap,
  rateMapWithIdentityV2,
  reportMap,
  reportMapPlayed,
  reportMapPlayedWithIdentityV2,
  reportMapWithIdentityV2,
  type MapGalleryEntry,
} from "./maps-client.js";
import {
  markThumbnailStarts,
  renderMapThumbnail,
  type MapThumbnail,
} from "./map-thumbnail.js";
import {
  buildLandscapeRenderAssets,
  createLandscapeScene,
  screenToMapTile,
  type LandscapeRenderAssets,
  type MapScroll,
} from "./landscape-scene.js";
import { MapEditorScreen, editorToCustomMap } from "./editor-screen.js";
import { mountRigHud, type RigSequenceEntry } from "./rig-hud.js";
import { mountBuildingEditor } from "./building-editor.js";

// The baked rig fixture shape written by scripts/build-rigs.mjs to
// public/rigs/<id>.json. Validated structurally at load; any mismatch makes
// the rig loader degrade to the normal title screen.
type RigFixture = {
  readonly rigKind: "local-game" | "editor-draft" | "gallery";
  readonly id: string;
  readonly gate: string;
  readonly check: string;
  readonly covers?: readonly string[];
  readonly title: string;
  readonly instruction: string;
  readonly result: string;
  readonly snapshot?: SerfboundLocalGameSnapshot;
  readonly map?: SerfboundCustomMap;
};
import {
  buildDecodedRenderAssets,
  buildDecodedRenderAssetsFromLicensedPackage,
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  type DecodedRenderAssets,
  type PointerMapInteraction,
} from "./render-layer-scene.js";
import {
  panelBarRect,
  panelButtonAt,
  panelButtonSprites,
  pointInPanelBar,
  uiScaleFor,
  type PanelBuildPossibility,
} from "./panel-bar.js";
import {
  buildPopupPageOrder,
  knightOccupationCycle,
  minimapTileAt,
  pointInPopup,
  popupBuildItemAt,
  popupRect,
  settAudioToggleAt,
  settOccupationRowAt,
  type PopupKind,
} from "./popup.js";

import {
  SerfboundAudioService,
  loadAudioSettings,
  saveAudioSettings,
} from "./audio.js";
import {
  initScreenRect,
  initScreenRowAt,
  nextSupplies,
  randomSeedString,
  type InitScreenSettings,
} from "./init-screen.js";

export * from "./panel-bar.js";
export * from "./popup.js";
export * from "./init-screen.js";
export * from "./audio.js";
export * from "./work-sounds.js";
export * from "./gestures.js";
export * from "./multiplayer.js";
export * from "./recap.js";
export * from "./hotseat.js";
export * from "./async-match.js";
export * from "./profile-store.js";
export * from "./identity-client.js";
export * from "./mailbox-client.js";
export * from "./maps-client.js";
export * from "./community-map-library-store.js";
export * from "./editor-screen.js";
export * from "./map-thumbnail.js";
export * from "./online-config.js";
export * from "./online-surface.js";
export * from "./online-match.js";
export * from "./identity-v2-client.js";
export * from "./identity-art.js";
export * from "./profile-stats.js";
export * from "./achievements.js";

export {
  BrowserIndexedDbImportedArchiveStore,
  InvalidStoredImportedArchiveRecordError,
  assertStoredImportedArchiveRecord,
  clearImportedArchiveRecord,
  cloneToArrayBuffer,
  createStoredImportedArchiveRecord,
  currentImportedArchiveKey,
  importedArchiveDatabaseName,
  importedArchiveStoreName,
  saveImportedArchiveRecord,
  type ImportedArchiveStore,
  type StorageOperationResult,
  type StoredImportedArchiveMetadata,
  type StoredImportedArchiveRecord,
} from "./imported-data-store.js";
export {
  BrowserIndexedDbLocalGameSaveStore,
  InvalidStoredLocalGameSaveRecordError,
  assertStoredLocalGameSaveRecord,
  clearLocalGameSaveRecord,
  createStoredLocalGameSaveRecord,
  currentLocalGameSaveKey,
  localGameSaveDatabaseName,
  localGameSaveStoreName,
  saveLocalGameSaveRecord,
  type LocalGameSaveOperationResult,
  type LocalGameSaveStore,
  type StoredLocalGameSaveMetadata,
  type StoredLocalGameSaveRecord,
} from "./local-game-save-store.js";
export {
  BrowserIndexedDbLicensedAssetPackageStore,
  InvalidStoredLicensedAssetPackageRecordError,
  assertStoredLicensedAssetPackageRecord,
  clearLicensedAssetPackageRecord,
  createStoredLicensedAssetPackageRecord,
  currentLicensedAssetPackageKey,
  licensedAssetPackageDatabaseName,
  licensedAssetPackageStoreName,
  loadLicensedAssetPackage,
  resolveLicensedAssetDeliveryConfig,
  resolveLicensedAssetDeliveryManifest,
  type LicensedAssetDeliveryConfig,
  type LicensedAssetDeliveryResult,
  type LicensedAssetFetch,
  type LicensedAssetPackageActivation,
  type LicensedAssetPackageStorageOperationResult,
  type LicensedAssetPackageStore,
  type StoredLicensedAssetPackageMetadata,
  type StoredLicensedAssetPackageRecord,
} from "./licensed-asset-delivery.js";
export {
  buildLandscapeRenderAssets,
  constructionCrossSprite,
  createLandscapeScene,
  flagWaveFrames,
  mapBuildingSprite,
  mapTileToScreen,
  screenToMapTile,
  type LandscapeRenderAssets,
  type LandscapeSceneOptions,
  type MapScroll,
} from "./landscape-scene.js";
export {
  buildDecodedRenderAssets,
  buildDecodedRenderAssetsFromLicensedPackage,
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  renderLayerOrder,
  type DecodedRenderAssets,
  type FirstRenderLayerScene,
  type PointerMapInteraction,
  type RenderLayerKey,
  type RenderSceneAssetSummary,
  type RenderSceneLayer,
  type RenderScenePrimitive,
  type RenderSceneSource,
  type RenderSpritePrimitive,
} from "./render-layer-scene.js";

export type AppBootstrapSummary = {
  readonly runtime: "browser";
  readonly enginePackage: string;
  readonly assetSource: string;
  readonly uint16Sample: number;
  readonly dataState: ArchiveValidationResult["state"];
};

export function bootstrapSummary(): AppBootstrapSummary {
  return {
    runtime: "browser",
    enginePackage: engineBoundary.name,
    assetSource: assetImportBoundary.source,
    uint16Sample: uint16(0x1ffff),
    dataState: "missing",
  };
}

export type MountSerfboundOptions = {
  readonly importedArchiveStore?: ImportedArchiveStore;
  readonly localGameSaveStore?: LocalGameSaveStore;
  readonly licensedAssetPackageStore?: LicensedAssetPackageStore;
  readonly licensedAssetDelivery?: LicensedAssetDeliveryConfig | null;
  readonly fetchLicensedAssetPackage?: LicensedAssetFetch;
};

type SceneRenderGenerated = () => void;
type SceneRenderCatalog = (
  typedAssetCatalog: TypedAssetCatalog,
  catalog: DosPaCatalog,
  archiveName: string,
  archiveBytes: ArrayBuffer | ArrayBufferView,
) => void;
type PointerLandscapeContext = {
  readonly landscape: LandscapeRenderAssets["landscape"];
  readonly scroll: MapScroll;
};

type PointerMapInteractionHandlers = {
  readonly commandRouter: () => SerfboundCommandRouter;
  readonly landscapeContext: () => PointerLandscapeContext | undefined;
  readonly worldCastlePending: () => boolean;
  readonly panelClick: (interaction: PointerMapInteraction) => boolean;
  readonly roadModeClick: (interaction: PointerMapInteraction) => boolean;
  readonly onWorldChanged: () => void;
  readonly onSelection: (interaction: PointerMapInteraction) => void;
  // Player-facing banner text (the in-canvas notice — the dev ledger
  // is not a product surface; SB-34 round 4).
  readonly onNotice?: (notice: string) => void;
};

// PWA: the offline app shell registers in secure contexts; original game
// data never flows through the worker (imports live in IndexedDB).
export function registerServiceWorker(): void {
  try {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      (globalThis.isSecureContext ?? false)
    ) {
      void navigator.serviceWorker.register("./sw.js").catch(() => {
        // Offline support is progressive; registration failures are quiet.
      });
    }
  } catch {
    // Older browsers simply play online.
  }
}

// Privacy-respecting error intake: errors buffer locally; the player
// copies a context report (no game data, no archive bytes) into an
// issue by explicit action only.
const serfboundVersion = "0.2.0";
const errorBuffer: { message: string; stack: string; at: string }[] = [];

// The build stamp (SB-20-05): serfbound.com shows exactly which tag and
// commit it is serving, so a player (or bug-hunter) can tell at a glance
// whether they're on the build they think they are. `version.json` is
// stamped at deploy time; this is the pure, CI-gateable formatter that
// turns it into a short human label.
export type SerfboundBuildInfo = {
  readonly version?: string;
  readonly tag?: string;
  readonly commit?: string;
  readonly builtAtIso?: string;
};

export function formatBuildStamp(raw: unknown): string {
  const info =
    raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const asText = (key: string): string | undefined => {
    const value = info[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  // A real tag wins over a branch name; "dev"/"main" are not releases.
  const tag = asText("tag");
  const version = asText("version");
  const release = tag ?? (version && version !== "dev" && version !== "main" ? version : undefined);
  const label = release ?? "dev build";

  const commit = asText("commit") ?? "";
  const shortCommit = /^[0-9a-f]{7,}$/i.test(commit) ? commit.slice(0, 7) : "";

  return shortCommit ? `${label} · ${shortCommit}` : label;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mapThumbnailDataUrl(thumbnail: MapThumbnail): string {
  const canvas = document.createElement("canvas");
  canvas.width = thumbnail.width;
  canvas.height = thumbnail.height;
  canvas
    .getContext("2d")
    ?.putImageData(
      new ImageData(
        new Uint8ClampedArray(thumbnail.rgba),
        thumbnail.width,
        thumbnail.height,
      ),
      0,
      0,
    );
  return canvas.toDataURL("image/png");
}

function recordError(message: string, stack: string | undefined): void {
  errorBuffer.push({
    message: message.slice(0, 500),
    stack: (stack ?? "").slice(0, 2000),
    at: new Date().toISOString(),
  });
  if (errorBuffer.length > 10) {
    errorBuffer.shift();
  }
}

export function buildErrorReport(gameFacts: Record<string, string | undefined>): string {
  return JSON.stringify(
    {
      product: "serfbound",
      version: serfboundVersion,
      userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
      generatedAt: new Date().toISOString(),
      gameFacts,
      errors: errorBuffer,
      note: "No game data or archive contents are included in this report.",
    },
    null,
    2,
  );
}

export function mountSerfbound(root: HTMLElement, options: MountSerfboundOptions = {}): void {
  const importedArchiveStore =
    options.importedArchiveStore ?? new BrowserIndexedDbImportedArchiveStore();
  const localGameSaveStore =
    options.localGameSaveStore ?? new BrowserIndexedDbLocalGameSaveStore();
  const licensedAssetPackageStore =
    options.licensedAssetPackageStore ?? new BrowserIndexedDbLicensedAssetPackageStore();
  const communityMapLibraryStore = new BrowserIndexedDbCommunityMapLibraryStore();
  const queryLicensedAssetDelivery = resolveLicensedAssetDeliveryConfig();
  const licensedAssetDelivery =
    options.licensedAssetDelivery === undefined
      ? queryLicensedAssetDelivery
      : options.licensedAssetDelivery;
  const discoverLicensedAssetManifest =
    options.licensedAssetDelivery === undefined && queryLicensedAssetDelivery === null;
  const fetchLicensedAssetPackage = options.fetchLicensedAssetPackage;
  // Language (SB-26-04): ?lang= wins, then the persisted choice, then
  // English. The whole game-font surface follows (SB-26-03 tables).
  const languageStorageKey = "serfbound.language";
  const initialLanguage = (() => {
    try {
      const fromUrl = new URLSearchParams(globalThis.location?.search ?? "").get("lang");
      if (fromUrl === "en" || fromUrl === "de") {
        globalThis.localStorage?.setItem(languageStorageKey, fromUrl);
        return fromUrl;
      }

      const stored = globalThis.localStorage?.getItem(languageStorageKey);
      return stored === "de" ? "de" : "en";
    } catch {
      return "en";
    }
  })();
  setUiLanguage(initialLanguage);
  root.dataset.serfboundLanguage = initialLanguage;

  // Local-first identity (SB-25-01): the profile loads with the shell
  // and persists on edit; no account required, ever.
  const profileStore = new BrowserIndexedDbProfileStore();
  let currentProfile: StoredSerfboundProfile = createProfile();
  const syncProfileState = () => {
    root.dataset.serfboundProfileName = currentProfile.name;
    root.dataset.serfboundProfileHistoryCount = String(currentProfile.history.length);
    const input = root.querySelector<HTMLInputElement>("[data-testid='profile-name-input']");
    if (input !== null && input.value !== currentProfile.name) {
      input.value = currentProfile.name;
    }

    const chronicle = root.querySelector<HTMLElement>("[data-testid='profile-chronicle']");
    if (chronicle !== null) {
      const count = currentProfile.history.length;
      chronicle.textContent =
        count === 0 ? "No matches yet" : `${count} ${count === 1 ? "match" : "matches"} recorded`;
    }

    // The chronicle proper (SB-30-02): statistics derived, never
    // collected; the campaign ledger; the recent record.
    const stats = deriveProfileStatistics(currentProfile.history);
    const statsElement = root.querySelector<HTMLElement>("[data-testid='chronicle-stats']");
    if (statsElement !== null) {
      statsElement.innerHTML =
        stats.played === 0
          ? `<p class="status-panel__detail">Your first match writes the first line.</p>`
          : `
            <div class="chronicle__stat"><span>${stats.won}</span> won</div>
            <div class="chronicle__stat"><span>${stats.lost}</span> lost</div>
            <div class="chronicle__stat"><span>${stats.currentStreak}</span> streak</div>
            <div class="chronicle__stat"><span>${stats.bestStreak}</span> best</div>`;
    }

    const campaignElement = root.querySelector<HTMLElement>("[data-testid='chronicle-campaign']");
    if (campaignElement !== null) {
      const completed = currentProfile.missionsCompleted?.length ?? 0;
      campaignElement.textContent =
        completed === 0
          ? "Not yet begun"
          : `${completed} of ${serfboundMissions.length} missions won`;
    }

    const historyElement = root.querySelector<HTMLElement>("[data-testid='chronicle-history']");
    if (historyElement !== null) {
      historyElement.innerHTML = currentProfile.history
        .slice(0, 8)
        .map(
          (entry) => `
            <div class="chronicle__entry chronicle__entry--${entry.result}">
              <span class="chronicle__opponent">${entry.opponentName}</span>
              <span class="chronicle__mode">${matchModeLabels[entry.mode]}</span>
              <span class="chronicle__result">${entry.result}</span>
              <span class="chronicle__date">${entry.endedAtIso.slice(0, 10)}</span>
            </div>`,
        )
        .join("");
    }

    // Deeds (SB-30-03): badges drawn from the player's own decoded
    // icon sheet; a medallion initial stands in until data decodes.
    const badgesElement = root.querySelector<HTMLElement>("[data-testid='chronicle-badges']");
    if (badgesElement !== null) {
      badgesElement.replaceChildren();
      root.dataset.serfboundAchievementCount = String(currentProfile.achievements?.length ?? 0);
      const unlocked = currentProfile.achievements ?? [];
      if (unlocked.length === 0) {
        const empty = document.createElement("p");
        empty.className = "status-panel__detail";
        empty.textContent = "Deeds await their doer.";
        badgesElement.append(empty);
      }

      for (const { id } of unlocked) {
        const definition = achievementById(id);
        if (definition === undefined) {
          continue;
        }

        const badge = document.createElement("div");
        badge.className = "deed";
        badge.title = definition.description;
        badge.dataset["achievementId"] = definition.id;
        const sprite = currentDecodedAssets?.rawIcons.get(definition.icon);
        if (sprite !== undefined) {
          const canvas = document.createElement("canvas");
          canvas.className = "deed__icon";
          canvas.width = sprite.width;
          canvas.height = sprite.height;
          canvas
            .getContext("2d")
            ?.putImageData(
              new ImageData(new Uint8ClampedArray(sprite.rgba), sprite.width, sprite.height),
              0,
              0,
            );
          badge.append(canvas);
        } else {
          const medallion = document.createElement("span");
          medallion.className = "deed__medallion";
          medallion.textContent = definition.name.slice(0, 1);
          badge.append(medallion);
        }

        const label = document.createElement("span");
        label.className = "deed__name";
        label.textContent = definition.name;
        badge.append(label);
        badgesElement.append(badge);
      }
    }

    // The identity row (SB-30-05): who you are, in the library's art.
    const avatar = avatarById(currentProfile.avatarId);
    const guild = guildById(currentProfile.guildId);
    root.dataset.serfboundAvatar = avatar?.id ?? "";
    root.dataset.serfboundGuild = guild?.id ?? "";
    const portrait = root.querySelector<HTMLImageElement>("[data-testid='identity-avatar']");
    if (portrait !== null) {
      portrait.hidden = avatar === undefined;
      if (avatar !== undefined) {
        portrait.src = avatar.src;
        portrait.title = avatar.name;
      }
    }

    const identityName = root.querySelector<HTMLElement>("[data-testid='identity-name']");
    if (identityName !== null) {
      identityName.textContent = currentProfile.name;
    }

    const guildRow = root.querySelector<HTMLElement>("[data-testid='identity-guild']");
    const guildBanner = root.querySelector<HTMLImageElement>(
      "[data-testid='identity-guild-banner']",
    );
    const guildName = root.querySelector<HTMLElement>("[data-testid='identity-guild-name']");
    if (guildRow !== null && guildBanner !== null && guildName !== null) {
      guildRow.hidden = guild === undefined;
      if (guild !== undefined) {
        guildBanner.src = guild.src;
        guildName.textContent = guild.name;
      }
    }

    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-avatar-id]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset["avatarId"] === currentProfile.avatarId),
      );
    }

    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-guild-id]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset["guildId"] === currentProfile.guildId),
      );
    }
  };
  const saveProfile = (next: StoredSerfboundProfile) => {
    currentProfile = next;
    syncProfileState();
    void profileStore.save(next).catch(() => {
      // Storage failures must never take the shell down.
    });
  };
  const recordMatchEnd = (
    mode: "realtime-loopback" | "async-loopback" | "online",
    opponentName: string | null,
    localPlayer: number,
    result: "won" | "lost" | "completed" | "abandoned",
  ) => {
    saveProfile(
      withMatchHistoryEntry(currentProfile, {
        mode,
        opponentName: opponentName ?? "UNKNOWN",
        localPlayer,
        result,
        endedAtIso: new Date().toISOString(),
      }),
    );
  };
  void profileStore.load().then((stored) => {
    if (stored !== null) {
      currentProfile = stored;
    }

    syncProfileState();
  });
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.dataset.serfboundDataState = summary.dataState;
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "empty";
  root.dataset.serfboundLicensedAssetState =
    licensedAssetDelivery === null && !discoverLicensedAssetManifest ? "not-configured" : "configured";
  root.dataset.serfboundActiveDataSource = "none";
  root.dataset.serfboundGameState = "setup";
  root.dataset.serfboundStartMode = "import-required";
  root.dataset.serfboundLocalGameState = "none";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundCommandState = "idle";
  root.dataset.serfboundCommandLogLength = "0";
  root.innerHTML = `
    <main class="serfbound-shell" data-testid="serfbound-shell">
      <section class="scene" aria-labelledby="serfbound-title">
        <div class="scene__toolbar">
          <div class="scene__brand">
            <img class="scene__emblem" src="./emblem.png" alt="" width="64" height="64" />
            <div>
              <p class="scene__kicker">New settlement</p>
              <h1 id="serfbound-title">Serfbound</h1>
            </div>
          </div>
          <div class="scene__toolbar-status">
            <div class="runtime-pill" data-testid="runtime-pill">Ready</div>
            <span
              class="build-stamp"
              data-testid="build-stamp"
              title="The tag and commit this build is serving"
            >dev build</span>
          </div>
        </div>
        <div class="scene__stage">
          <canvas
            class="terrain-preview"
            data-testid="terrain-preview"
            width="960"
            height="540"
            aria-label="First Serfbound render-layer scene"
          ></canvas>
          <div class="welcome" data-testid="welcome-screen">
            <div class="welcome__card">
              <p class="scene__kicker">Your realm awaits</p>
              <h2 class="welcome__title">The complete classic Settlers, running in your browser</h2>
              <p class="welcome__body">Serfbound brings the original 1993 game to life from your own data file: every production chain, knights and conquest, the full campaign, sound and music. Bring your SPAU.PA and the realm is yours.</p>
              <label
                class="welcome__drop"
                data-testid="welcome-drop-zone"
                for="data-import"
                aria-hidden="true"
              >
                <strong>Drop your SPAU.PA here</strong>
                <span>or click to browse</span>
              </label>
              <p class="welcome__error" data-testid="welcome-error" hidden></p>
              <p class="welcome__promise">Your data never leaves this device. No uploads, no required accounts, no passive tracking.</p>
              <p class="welcome__hint">Don't own the game? The free demo's SPAU.PA works too.</p>
            </div>
          </div>
          <div class="editor-surface" data-testid="editor-surface" hidden>
            <div class="editor-bar">
              <div class="editor-tools" data-testid="editor-tools" role="toolbar" aria-label="Map tools"></div>
              <div class="editor-actions">
                <button class="secondary-action" data-testid="editor-copy-button" type="button">Copy region</button>
                <button class="secondary-action" data-testid="editor-paste-button" type="button">Paste</button>
                <button class="secondary-action" data-testid="editor-validate-button" type="button">Validate</button>
                <button class="secondary-action" data-testid="editor-publish-button" type="button" disabled>Publish</button>
                <button class="primary-action" data-testid="editor-play-button" type="button">Play this map</button>
                <button class="secondary-action" data-testid="editor-exit-button" type="button">Back</button>
              </div>
            </div>
            <div class="editor-status" data-testid="editor-status"></div>
          </div>
        </div>
      </section>
      <aside class="status-panel" aria-label="Serfbound status">
        <p
          class="visually-hidden"
          data-testid="notification-live"
          aria-live="polite"
        ></p>
        <section class="panel-group panel-group--data">
          <h2 class="panel-group__title">Your data</h2>
          <div
            class="status-panel__detail"
            data-testid="onboarding-banner"
            role="note"
          >First run: 1) locate your original Settlers SPAU.PA file, 2) use Import data below (it stays on this device), 3) press START on the title screen.</div>
          <div>
            <p class="status-panel__label">Data</p>
            <p class="status-panel__value" data-testid="data-state">No game data</p>
          </div>
          <p class="status-panel__detail" data-testid="data-detail">Import SPAU.PA to start a local game.</p>
          <div>
            <p class="status-panel__label">Source</p>
            <p class="status-panel__value" data-testid="data-source-state">No data</p>
          </div>
          <div class="panel-group__actions">
            <input
              id="data-import"
              class="import-input"
              data-testid="data-import-input"
              type="file"
              accept=".PA,.pa"
              tabindex="-1"
            />
            <label
              class="secondary-action import-control"
              data-testid="data-import-control"
              for="data-import"
              role="button"
              tabindex="0"
            >Import data</label>
            <button
              class="secondary-action"
              data-testid="data-reset-button"
              type="button"
              disabled
            >Clear data</button>
          </div>
        </section>
        <section class="panel-group panel-group--realm">
          <h2 class="panel-group__title">The realm</h2>
          <div>
            <p class="status-panel__label">Game</p>
            <p class="status-panel__value" data-testid="game-state">Data needed</p>
          </div>
          <p class="status-panel__detail" data-testid="game-detail">Import game data first.</p>
          <div class="panel-group__actions">
            <button
              class="primary-action"
              data-testid="start-game-button"
              type="button"
              disabled
            >Start game</button>
            <button
              class="secondary-action"
              data-testid="open-editor-button"
              type="button"
              disabled
            >Build a map</button>
          </div>
        </section>
        <section class="panel-group panel-group--ledger">
          <h2 class="panel-group__title">The ledger</h2>
          <div>
            <p class="status-panel__label">Save</p>
            <p class="status-panel__value" data-testid="save-state">No saved game</p>
          </div>
          <p class="status-panel__detail" data-testid="save-detail">Start a game to save.</p>
          <div class="panel-group__actions">
            <button
              class="secondary-action"
              data-testid="save-game-button"
              type="button"
              disabled
            >Save game</button>
            <button
              class="secondary-action"
              data-testid="load-game-button"
              type="button"
              disabled
            >Load game</button>
            <button
              class="secondary-action"
              data-testid="clear-save-button"
              type="button"
              disabled
            >Clear save</button>
          </div>
        </section>
        <section class="panel-group panel-group--company">
          <h2 class="panel-group__title">Play with someone</h2>
          <div class="identity-row" data-testid="identity-row">
            <img
              class="identity-portrait"
              data-testid="identity-avatar"
              src="./avatars/knight.png"
              alt=""
              width="64"
              height="64"
              hidden
            />
            <div>
              <p class="status-panel__value" data-testid="identity-name">PLAYER</p>
              <p class="identity-guild" data-testid="identity-guild" hidden>
                <img
                  class="identity-banner"
                  data-testid="identity-guild-banner"
                  src="./guilds/wolf.png"
                  alt=""
                  width="20"
                  height="20"
                />
                <span data-testid="identity-guild-name"></span>
              </p>
            </div>
          </div>
          <details class="identity-picker" data-testid="identity-picker">
            <summary>Choose your avatar and guild</summary>
            <p class="status-panel__label">Avatar</p>
            <div class="identity-choices" data-testid="avatar-choices"></div>
            <p class="status-panel__label">Guild</p>
            <div class="identity-choices" data-testid="guild-choices"></div>
          </details>
          <details class="chronicle" data-testid="chronicle">
            <summary>
              <span class="status-panel__label">Chronicle</span>
              <span class="status-panel__value" data-testid="profile-chronicle">No matches yet</span>
            </summary>
            <p class="status-panel__detail">Kept on this device, like your saves — never uploaded.</p>
            <div class="chronicle__stats" data-testid="chronicle-stats"></div>
            <p class="status-panel__detail" data-testid="chronicle-rating" hidden></p>
            <div>
              <p class="status-panel__label">Campaign</p>
              <p class="status-panel__value" data-testid="chronicle-campaign">Not yet begun</p>
            </div>
            <div>
              <p class="status-panel__label">Deeds</p>
              <div class="chronicle__badges" data-testid="chronicle-badges"></div>
            </div>
            <div class="chronicle__history" data-testid="chronicle-history"></div>
          </details>
          <div class="panel-group__actions">
            <input
              class="secondary-action"
              data-testid="profile-name-input"
              type="text"
              maxlength="12"
              placeholder="Profile name"
              aria-label="Profile name"
            />
            <button
              class="secondary-action"
              data-testid="hotseat-button"
              type="button"
            >Hot-seat 2P (pass and play)</button>
            <button
              class="secondary-action"
              data-testid="host-loopback-button"
              type="button"
            >Host 2P (this browser)</button>
            <button
              class="secondary-action"
              data-testid="join-loopback-button"
              type="button"
            >Join 2P (this browser)</button>
            <button
              class="secondary-action"
              data-testid="async-host-button"
              type="button"
            >Async 2P host (this browser)</button>
            <button
              class="secondary-action"
              data-testid="async-join-button"
              type="button"
            >Async 2P join (this browser)</button>
          </div>
        </section>
        <section class="panel-group panel-group--online">
          <h2 class="panel-group__title">Online</h2>
          <div>
            <p class="status-panel__label">Account</p>
            <p class="status-panel__value" data-testid="online-state">Signed out</p>
          </div>
          <p class="status-panel__detail" data-testid="online-detail">Optional: play correspondence matches over the internet. Local play never needs this.</p>
          <p class="status-panel__detail">Online identity is optional. Sign-in stores only the credential data required for the method you choose and the public name you play under. Your game data never uploads.</p>
          <div class="signin-moment" data-testid="signin-moment">
            <p class="status-panel__label">Sign in</p>
            <div class="signin-methods" role="group" aria-label="Sign-in method">
              <button
                class="signin-method is-active"
                data-testid="signin-method-email"
                data-signin-method="email"
                type="button"
                aria-pressed="true"
              >Email</button>
              <button
                class="signin-method"
                data-testid="signin-method-passkey"
                data-signin-method="passkey"
                type="button"
                aria-pressed="false"
              >Passkey</button>
              <button
                class="signin-method"
                data-testid="signin-method-google"
                data-signin-method="google"
                type="button"
                aria-pressed="false"
              >Google</button>
              <button
                class="signin-method"
                data-testid="signin-method-apple"
                data-signin-method="apple"
                type="button"
                aria-pressed="false"
              >Apple</button>
              <button
                class="signin-method"
                data-testid="signin-method-meta"
                data-signin-method="meta"
                type="button"
                aria-pressed="false"
              >Meta</button>
            </div>
            <div class="signin-pane" data-signin-panel="email" data-testid="signin-email-form">
              <input
                class="signin-field"
                data-testid="signin-email-input"
                type="email"
                autocomplete="email"
                placeholder="settler@example.com"
                aria-label="Email"
              />
              <input
                class="signin-field"
                data-testid="signin-password-input"
                type="password"
                autocomplete="current-password"
                placeholder="Password"
                aria-label="Password"
              />
              <button
                class="secondary-action"
                data-testid="signin-email-submit"
                type="button"
              >Continue with email</button>
            </div>
            <div class="signin-pane" data-signin-panel="passkey" data-testid="signin-passkey-prompt" hidden>
              <p class="status-panel__detail">Use a passkey when this browser can prove it owns the credential. No private key leaves this device.</p>
              <button
                class="secondary-action"
                data-testid="signin-passkey-button"
                type="button"
              >Use a passkey</button>
            </div>
            <div class="signin-pane" data-signin-panel="provider" data-testid="signin-provider-note" hidden>
              <p class="status-panel__detail">Continue with <span data-testid="signin-provider-name">Google</span>. Serfbound stores the provider, provider account id, optional email metadata, and your public name.</p>
            </div>
            <p class="status-panel__detail" data-testid="signin-moment-state">Choose a sign-in method when you want the social realm; local play stays open.</p>
            <p class="status-panel__detail signin-accountless" data-testid="signin-accountless-note">Start game stays accountless: no registration, no sign-in, no network.</p>
          </div>
          <p class="online-badge" data-testid="online-your-turn" hidden>Your turn in 0 matches</p>
          <div class="match-strip" data-testid="online-match-strip" hidden>
            <p class="status-panel__label">Current match</p>
            <p class="status-panel__value" data-testid="online-match-line">—</p>
          </div>
          <div class="legacy-online-bridge">
            <p class="status-panel__label">Correspondence bridge</p>
            <p class="status-panel__detail">For now, correspondence matches still use a local match key.</p>
          </div>
          <div class="panel-group__actions">
            <button
              class="secondary-action"
              data-testid="online-signin-button"
              type="button"
            >Use local match key</button>
            <button
              class="secondary-action"
              data-testid="online-refresh-button"
              type="button"
            >Refresh online</button>
            <button
              class="secondary-action"
              data-testid="online-challenge-button"
              type="button"
              disabled
            >Post online challenge</button>
            <div class="online-lobby" data-testid="online-lobby"></div>
            <details class="ladder" data-testid="online-ladder">
              <summary>The ladder</summary>
              <div class="ladder__rows" data-testid="online-ladder-rows"></div>
              <p class="status-panel__detail" data-testid="online-ladder-note" hidden></p>
              <p class="status-panel__detail">Ratings are reputation, nothing more: only matches both players attest get rated, and disagreements sit quarantined, unrated.</p>
            </details>
            <p class="status-panel__label" data-testid="online-seal-label" hidden>Seal the result</p>
            <button
              class="secondary-action"
              data-testid="online-attest-win-button"
              type="button"
              hidden
            >Attest result: I won</button>
            <button
              class="secondary-action"
              data-testid="online-attest-loss-button"
              type="button"
              hidden
            >Attest result: I lost</button>
          </div>
        </section>
        <section class="panel-group panel-group--community">
          <h2 class="panel-group__title">Community maps</h2>
          <div>
            <p class="status-panel__label">Gallery</p>
            <p class="status-panel__value" data-testid="maps-state">Not loaded</p>
          </div>
          <p class="status-panel__detail" data-testid="maps-detail">Browse without game data; play downloaded maps with your own data.</p>
          <div class="community-map-controls">
            <input
              class="community-map-title"
              data-testid="maps-title-input"
              type="text"
              maxlength="40"
              value="COMMUNITY MAP"
              aria-label="Community map title"
            />
            <div class="community-map-filters">
              <select data-testid="maps-filter-players" aria-label="Players">
                <option value="">All players</option>
                <option value="1">1 player</option>
                <option value="2">2 players</option>
                <option value="3">3 players</option>
                <option value="4">4 players</option>
              </select>
              <select data-testid="maps-sort" aria-label="Sort maps">
                <option value="popular">Popular</option>
                <option value="rating">Rating</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
          <div class="panel-group__actions">
            <button
              class="secondary-action"
              data-testid="maps-signin-button"
              type="button"
            >Sign in for maps</button>
            <button
              class="secondary-action"
              data-testid="maps-refresh-button"
              type="button"
            >Browse gallery</button>
            <button
              class="primary-action"
              data-testid="maps-publish-button"
              type="button"
              disabled
            >Publish open map</button>
          </div>
          <div class="community-map-gallery" data-testid="maps-gallery"></div>
          <div class="community-map-library" data-testid="maps-library"></div>
        </section>
        <section class="panel-group panel-group--service">
          <h2 class="panel-group__title">Housekeeping</h2>
          <div class="panel-group__actions">
            <button
              class="secondary-action"
              data-testid="language-button"
              type="button"
            >Language</button>
            <button
              class="secondary-action"
              data-testid="view-scale-button"
              type="button"
            >View scale</button>
          </div>
        </section>
        <details class="dev-ledger" data-testid="dev-ledger">
          <summary>Under the hood</summary>
          <p class="status-panel__detail">The realm's inner workings — for the curious and the bug-hunters. Playing never needs this.</p>
          <div>
            <p class="status-panel__label">Source</p>
            <p class="status-panel__value" data-testid="source-state">No data</p>
          </div>
          <div>
            <p class="status-panel__label">Map</p>
            <p class="status-panel__value" data-testid="scene-state">Waiting for data</p>
          </div>
          <p class="status-panel__detail" data-testid="scene-detail">Select land to inspect it.</p>
          <div>
            <p class="status-panel__label">Hover</p>
            <p class="status-panel__value" data-testid="pointer-state">No map target</p>
          </div>
          <p class="status-panel__detail" data-testid="pointer-detail">Move over the map.</p>
          <div>
            <p class="status-panel__label">Selected Tile</p>
            <p class="status-panel__value" data-testid="selected-tile-state">No tile selected</p>
          </div>
          <p class="status-panel__detail" data-testid="selected-tile-detail">Select land to see its position.</p>
          <div>
            <p class="status-panel__label">Action</p>
            <p class="status-panel__value" data-testid="command-state">No action selected</p>
          </div>
          <div>
            <p class="status-panel__label">Pulse</p>
            <p class="status-panel__value" data-testid="pulse-state">Not running</p>
          </div>
          <p class="status-panel__detail" data-testid="command-detail">Select a tile to inspect available actions.</p>
          <div class="panel-group__actions">
            <button
              class="secondary-action"
              data-testid="build-flag-button"
              type="button"
              disabled
            >Build flag</button>
            <button
              class="secondary-action"
              data-testid="build-road-button"
              type="button"
              disabled
            >Build road</button>
            <button
              class="secondary-action"
              data-testid="build-lumberjack-button"
              type="button"
              disabled
            >Build lumberjack</button>
            <button
              class="secondary-action"
              data-testid="error-report-button"
              type="button"
            >Copy error report</button>
          </div>
        </details>
      </aside>
    </main>
  `;

  // Dev mode (SB-32-06): `?dev=1` opens the under-the-hood ledger and
  // keeps every group visible in every chrome state — the surface the
  // test suite and bug-hunters drive. Players get the product.
  try {
    if (new URLSearchParams(globalThis.location?.search ?? "").get("dev") === "1") {
      root.dataset.serfboundDev = "1";
      root.querySelector<HTMLDetailsElement>("[data-testid='dev-ledger']")?.setAttribute(
        "open",
        "",
      );
    }
  } catch {
    // No location (tests without DOM navigation): player surface.
  }

  // Build stamp (SB-20-05): fetch the deploy-time version.json and show
  // the tag + commit this build is serving. Failure is silent — a local
  // dev build has no version.json and the element just reads "dev build".
  void (async () => {
    const stampElement = root.querySelector<HTMLElement>("[data-testid='build-stamp']");
    if (stampElement === null) {
      return;
    }
    try {
      const response = await fetch("./version.json", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const info = (await response.json()) as SerfboundBuildInfo;
      const label = formatBuildStamp(info);
      stampElement.textContent = label;
      const fullCommit =
        typeof info.commit === "string" && /^[0-9a-f]{7,}$/i.test(info.commit)
          ? info.commit
          : undefined;
      stampElement.title = [
        `Serving ${label}`,
        fullCommit ? `commit ${fullCommit}` : undefined,
        typeof info.builtAtIso === "string" ? `built ${info.builtAtIso}` : undefined,
      ]
        .filter(Boolean)
        .join(" — ");
    } catch {
      // Offline or no version.json: the static "dev build" label stands.
    }
  })();

  // Chrome states (SB-32-02, standard §4): the shell composition
  // follows the player's journey — pre-import, title, running. CSS
  // keys off this; the observer keeps it true wherever game/data
  // state changes.
  const syncChromeState = () => {
    const chrome =
      root.dataset.serfboundEditor === "open"
        ? "editor"
        : root.dataset.serfboundGameState === "running"
          ? "running"
          : root.dataset.serfboundDataState === "supported"
            ? "title"
            : "pre-import";
    if (root.dataset.serfboundChrome !== chrome) {
      root.dataset.serfboundChrome = chrome;
      // The game must be ON SCREEN when it starts: on the stacked
      // mobile layout the start button lives below the fold, and a
      // freshly running game out of view is unplayable (SB-34 punch
      // list — the root of "taps do nothing").
      if (chrome === "running") {
        root
          .querySelector<HTMLElement>("[data-testid='terrain-preview']")
          ?.scrollIntoView({ block: "start" });
      }
    }
  };
  syncChromeState();
  new MutationObserver(syncChromeState).observe(root, {
    attributes: true,
    attributeFilter: ["data-serfbound-game-state", "data-serfbound-data-state", "data-serfbound-editor"],
  });

  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }
  let commandRouter = new SerfboundCommandRouter();
  root.dataset.serfboundEnginePackage = summary.enginePackage;

  let currentTypedAssetCatalog: TypedAssetCatalog | undefined;
  let currentDecodedAssets: DecodedRenderAssets | undefined;
  let currentLandscapeAssets: LandscapeRenderAssets | undefined;
  let currentWorld: ReturnType<SerfboundLocalGame["world"]> | undefined;
  let currentSerfEngine: ReturnType<SerfboundLocalGame["serfEngine"]> | undefined;
  let currentScroll: MapScroll = { column: 0, row: 0 };
  let currentImportedDataSource: SerfboundLocalGameDataSource | undefined;
  let currentBuiltStructures: readonly SerfboundBuiltStructure[] = [];
  let currentLocalGameSnapshot: SerfboundLocalGameSnapshot | undefined;
  let currentSavedLocalGame: StoredLocalGameSaveRecord | undefined;
  let selectedInteraction: PointerMapInteraction | undefined;
  let currentPopup: PopupKind | undefined;
  let currentAiPlayers: SerfboundAiPlayer[] = [];
  // Loopback multiplayer (SB-22-04): the active session and which world
  // player this tab controls.
  let currentMultiplayer: SerfboundLoopbackMultiplayer | undefined;
  let currentLocalPlayer = 0;
  // Hot-seat correspondence (SB-23-03).
  let currentHotseat: HotseatController | undefined;
  // Two-tab async correspondence (SB-23-04).
  let currentAsync: SerfboundAsyncLoopbackMatch | undefined;
  // Online correspondence through the deployed mailbox (SB-29-04).
  let currentOnline: SerfboundOnlineMatch | undefined;
  let lastHotseatMode: "recap" | "your-window" | "" = "";
  // Game speed: ticks per frame scale by the reference-style multiplier
  // (0 pauses). Keys: 1/2/4 set speeds, 0 pauses.
  let gameSpeedMultiplier = 1;
  const setGameSpeed = (multiplier: number) => {
    gameSpeedMultiplier = multiplier;
    root.dataset.serfboundGameSpeed = String(multiplier);
  };
  // Autosave: every 512 sim ticks the running game saves silently.
  let autosaveCount = 0;
  let lastAutosaveTick = 0;
  // AI drivers for every non-human slot of the running game.
  const attachAiPlayers = (game: SerfboundLocalGame) => {
    currentAiPlayers = [];
    const playerCount = game.settings.playerCount ?? 1;
    if (playerCount <= 1 || currentWorld === undefined || currentSerfEngine === undefined) {
      root.dataset.serfboundAiCount = "0";
      return;
    }

    for (let playerIndex = 1; playerIndex < playerCount; playerIndex += 1) {
      currentAiPlayers.push(
        new SerfboundAiPlayer(currentWorld, currentSerfEngine, playerIndex, (action) =>
          game.state.recordWorldAction(action),
        ),
      );
    }

    root.dataset.serfboundAiCount = String(currentAiPlayers.length);
  };
  const setPopup = (popup: PopupKind | undefined) => {
    currentPopup = popup;
    if (popup === undefined) {
      delete root.dataset.serfboundPopup;
    } else {
      root.dataset.serfboundPopup = popup;
    }
  };
  // The browser audio service: DOS clips loaded with decoded assets,
  // unlocked by the first canvas gesture (autoplay policy).
  const audioService = new SerfboundAudioService();
  activeAudioService = audioService;
  try {
    const persisted = loadAudioSettings(globalThis.localStorage);
    if (persisted !== null) {
      audioService.applySettings(persisted);
    }
  } catch {
    // No storage available: defaults apply.
  }
  root.ownerDocument.addEventListener("visibilitychange", () => {
    audioService.setVisible(!root.ownerDocument.hidden);
  });
  globalThis.addEventListener?.("error", (event) => {
    recordError(String(event.message ?? event), (event as ErrorEvent).error?.stack);
    root.dataset.serfboundErrorCount = String(errorBuffer.length);
  });
  globalThis.addEventListener?.("unhandledrejection", (event) => {
    recordError(String((event as PromiseRejectionEvent).reason), undefined);
    root.dataset.serfboundErrorCount = String(errorBuffer.length);
  });
  const errorReportButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='error-report-button']",
  );
  errorReportButton?.addEventListener("click", () => {
    const report = buildErrorReport({
      gameState: root.dataset.serfboundGameState,
      gameTick: root.dataset.serfboundGameTick,
      seed: root.dataset.serfboundLocalGameSeed,
      mapSize: root.dataset.serfboundLocalGameMapSize,
      mission: root.dataset.serfboundInitMission,
      sceneSource: root.dataset.serfboundSceneSource,
    });
    root.dataset.serfboundErrorReportSize = String(report.length);
    void globalThis.navigator?.clipboard?.writeText(report).then(
      () => {
        root.dataset.serfboundErrorReportState = "copied";
      },
      () => {
        root.dataset.serfboundErrorReportState = "clipboard-unavailable";
      },
    );
  });
  const syncAudioState = () => {
    root.dataset.serfboundAudio = audioService.state;
    root.dataset.serfboundMusic = audioService.musicState;
    if (audioService.lastSfx !== null) {
      root.dataset.serfboundLastSfx = String(audioService.lastSfx);
    }
  };
  // The start screen's custom-game choices (GameInitBox settings).
  let startGameNowRef:
    | ((options: { seedString?: string; initialSupplies?: number; mission?: string }) => void)
    | undefined;
  // ?seed=XXXXXXXXXXXXXXXX (16 digits 1-8) pins the start-screen seed:
  // shareable worlds, and deterministic e2e runs. Otherwise random.
  const urlSeed = (() => {
    try {
      const value = new URLSearchParams(globalThis.location?.search ?? "").get("seed");
      return value !== null && /^[1-8]{16}$/.test(value) ? value : undefined;
    } catch {
      return undefined;
    }
  })();
  let initSeedString = urlSeed ?? randomSeedString(Math.random);
  let initSupplies = 20;
  let initMission: string | undefined;
  const initScreenSettings = (): InitScreenSettings | undefined => {
    if (
      currentDecodedAssets === undefined ||
      currentImportedDataSource === undefined ||
      root.dataset.serfboundGameState === "running"
    ) {
      return undefined;
    }

    const mission = initMission === undefined ? undefined : findSerfboundMission(initMission);
    const seedString = mission?.seedString ?? initSeedString;
    const supplies = mission?.players[0]?.supplies ?? initSupplies;
    root.dataset.serfboundInitSeed = seedString;
    root.dataset.serfboundInitSupplies = String(supplies);
    root.dataset.serfboundInitMission = initMission ?? "CUSTOM";
    return {
      seedString,
      initialSupplies: supplies,
      mapSize: 3,
      ...(initMission === undefined ? {} : { mission: initMission }),
    };
  };
  // Notifications surface game events in the game font until replaced.
  let currentNotice: string | undefined;
  let lastDoneBuildingCount = 0;
  const setNotice = (notice: string | undefined) => {
    currentNotice = notice;
    const live = root.querySelector<HTMLElement>("[data-testid='notification-live']");
    if (notice === undefined) {
      delete root.dataset.serfboundNotification;
      if (live !== null) {
        live.textContent = "";
      }
    } else {
      root.dataset.serfboundNotification = notice;
      if (live !== null) {
        live.textContent = notice;
      }
    }
  };
  let syncCommunityMapsState = () => {};
  const syncOnboarding = () => {
    const banner = root.querySelector<HTMLElement>("[data-testid='onboarding-banner']");
    if (banner !== null) {
      banner.hidden = root.dataset.serfboundDataState === "supported";
    }
  };
  // The authentic panel bar's build slot mirrors what the selected tile
  // allows (reference Interface.BuildPossibility, condensed).
  const computeBuildPossibility = (): PanelBuildPossibility => {
    const world = currentWorld;
    const tile = selectedInteraction?.tile;
    if (world === undefined || tile === undefined || root.dataset.serfboundGameState !== "running") {
      return "none";
    }

    const position = tile.position;
    if (world.players[0]?.hasCastle === false) {
      return world.canBuildCastle(position, 0) ? "castle" : "none";
    }

    // Reference Interface.BuildPossibility: standing on an own flag,
    // the build act is a road from it (SB-34 round 4).
    const flag = world.flagAt(position);
    if (flag !== null && flag.player === currentLocalPlayer) {
      return "road";
    }

    if (world.canBuildBuilding(position, 17, 0)) return "large";
    if (world.canBuildBuilding(position, 2, 0)) return "small";
    if (world.canBuildBuilding(position, 6, 0)) return "mine";
    if (world.canBuildFlag(position, 0)) return "flag";
    return "none";
  };
  const computePanelButtons = (): number[] | undefined => {
    if (currentWorld === undefined || currentLandscapeAssets === undefined) {
      return undefined;
    }

    return panelButtonSprites({
      buildPossibility: computeBuildPossibility(),
      roadMode: root.dataset.serfboundRoadMode !== "idle" &&
        root.dataset.serfboundRoadMode !== undefined,
    });
  };
  // The sound of work (SB-38-05): every visible working serf's frame
  // transitions feed the RenderSerf rules; entering a trigger frame
  // plays its clip through the audio service.
  const workSoundFrames = new Map<number, number>();
  const playWorkSounds = () => {
    const table = currentDecodedAssets?.serfAnimationTable;
    if (table == null || currentSerfEngine === undefined || currentWorld === undefined) {
      return;
    }

    if (workSoundFrames.size > 4096) {
      workSoundFrames.clear();
    }

    for (const serf of currentSerfEngine.serfs.values()) {
      if (serf.state === 0 || serf.state === 1) {
        continue;
      }

      const row = table[serf.animation];
      if (row === undefined || row.length === 0) {
        continue;
      }

      const phase = Math.min(Math.max(serf.counter, 0) >> 3, row.length - 1);
      const frameSprite = row[phase]!.sprite;
      const previous = workSoundFrames.get(serf.index) ?? -1;
      if (frameSprite === previous) {
        continue;
      }

      workSoundFrames.set(serf.index, frameSprite);

      // Off-screen work stays quiet, like the reference's
      // viewport-scoped render serfs.
      const screen = mapTileToScreen(
        currentWorld,
        {
          column: serf.position % currentWorld.columns,
          row: Math.trunc(serf.position / currentWorld.columns),
        },
        currentScroll,
      );
      if (
        screen === null ||
        screen.x < -64 ||
        screen.x > 1600 ||
        screen.y < -64 ||
        screen.y > 1200
      ) {
        continue;
      }

      const building =
        serf.workBuildingIndex === 0
          ? undefined
          : currentWorld.buildings.get(serf.workBuildingIndex);
      const clip = workActionSound({
        workBuildingType: building?.type ?? 0,
        state: serf.state,
        workStage: serf.walkingWaitCounter,
        frameSprite,
        previousFrameSprite: previous,
      });
      if (clip !== null) {
        audioService.playSfx(clip);
      }
    }
  };

  const renderCurrentScene = () => {
    // The map editor owns the shared canvas while open (SB-42-05); the
    // game's scene loop must not overwrite the editor's render.
    if (root.dataset.serfboundEditor === "open") {
      return;
    }
    syncOnboarding();
    playWorkSounds();
    const panelButtons = computePanelButtons();
    if (panelButtons === undefined) {
      delete root.dataset.serfboundPanelButtons;
    } else {
      root.dataset.serfboundPanelButtons = panelButtons.join(",");
    }

    renderScene(
      root,
      currentTypedAssetCatalog,
      currentDecodedAssets,
      currentLandscapeAssets,
      currentWorld,
      currentSerfEngine === undefined || currentWorld === undefined
        ? undefined
        : [...currentSerfEngine.serfs.values()]
            .filter(
              (serf) =>
                serf.state !== 0 &&
                serf.state !== 1 &&
                // Workers resting inside their building stay hidden
                // (state working, phase 0 — SB-34 round 7).
                !(serf.state === 11 && serf.workPhase === 0 && serf.workBuildingIndex !== 0),
            )
            .map((serf) => ({
              position: serf.position,
              animation: serf.animation,
              counter: serf.counter,
              // The profession sprite-bank offset dresses the serf.
              bodyOffset: serfBodyOffset(serf, currentWorld!),
            })),
      currentScroll,
      currentTick,
      currentBuiltStructures,
      panelButtons,
      currentPopup,
      currentNotice,
      initScreenSettings(),
      { sfxMuted: audioService.sfxMuted, musicMuted: audioService.musicMuted },
      selectedInteraction?.tile,
      roadBuilderPath === undefined ? undefined : { positions: roadBuilderPath },
    );

    // SB-34-03: publish the chrome's hit rectangles in canvas CSS space
    // so touch gates can verify hit-truth at any device pixel ratio.
    if (currentWorld !== undefined && root.dataset.serfboundGameState === "running") {
      const size = { width: canvas.width, height: canvas.height };
      const uiScale = uiScaleFor(size, canvasPixelRatio);
      const cssFactor = canvas.clientWidth > 0 ? canvas.clientWidth / canvas.width : 1;
      const asCssRect = (rect: { x: number; y: number; width: number; height: number }) =>
        [rect.x, rect.y, rect.width, rect.height]
          .map((value) => String(Math.round(value * cssFactor)))
          .join(",");
      root.dataset.serfboundPanelRect = asCssRect(panelBarRect(size, uiScale));
      if (currentPopup === undefined) {
        delete root.dataset.serfboundPopupRect;
      } else {
        root.dataset.serfboundPopupRect = asCssRect(popupRect(size, uiScale));
      }
    } else {
      delete root.dataset.serfboundPanelRect;
      delete root.dataset.serfboundPopupRect;
    }
  };
  const applyScroll = (columnDelta: number, rowDelta: number) => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    const landscape = currentLandscapeAssets.landscape;
    currentScroll = {
      column:
        (((currentScroll.column + columnDelta) % landscape.columns) + landscape.columns) %
        landscape.columns,
      row: (((currentScroll.row + rowDelta) % landscape.rows) + landscape.rows) % landscape.rows,
    };
    renderCurrentScene();
  };
  // Center the camera on a map position. Used when a world loads already
  // populated (rigs, saved games) so it opens on the action instead of the map
  // origin — which on a half-water map is open sea. scroll is the top-left tile,
  // so subtract half the visible tiles (tile is 32x20 px, scaled by worldScale).
  const centerScrollOnPosition = (position: number) => {
    if (currentLandscapeAssets === undefined) {
      return;
    }
    const { columns, rows } = currentLandscapeAssets.landscape;
    const col = ((position % columns) + columns) % columns;
    const row = Math.trunc(position / columns);
    const scale = Math.max(1, effectiveWorldScale());
    const halfCols = Math.round(canvas.width / (32 * scale) / 2);
    const halfRows = Math.round(canvas.height / (20 * scale) / 2);
    // Row centering is straightforward. Column centering must undo the
    // renderer's per-row stagger (columnShift = (r + (r&1)) >> 1, the same
    // term mapTileToScreen applies), or the focus lands off to one side.
    const scrollRow = (((row - halfRows) % rows) + rows) % rows;
    const r = (((row - scrollRow) % rows) + rows) % rows;
    const columnShift = (r + (r & 1)) >> 1;
    const scrollColumn = (((col - columnShift - halfCols) % columns) + columns) % columns;
    currentScroll = { column: scrollColumn, row: scrollRow };
  };
  // SB-26-04: the language toggle persists and re-renders the scene.
  root
    .querySelector<HTMLButtonElement>("[data-testid='language-button']")
    ?.addEventListener("click", () => {
      const next = getUiLanguage() === "en" ? "de" : "en";
      setUiLanguage(next);
      root.dataset.serfboundLanguage = next;
      try {
        globalThis.localStorage?.setItem(languageStorageKey, next);
      } catch {
        // storage failures never take the shell down
      }

      renderCurrentScene();
    });
  // SB-21-03: the shell's view-scale control cycles the world zoom
  // (1x/2x/3x), same as the 'v' key.
  root
    .querySelector<HTMLButtonElement>("[data-testid='view-scale-button']")
    ?.addEventListener("click", () => {
      cycleWorldViewScale();
      renderCurrentScene();
    });
  let currentTick = 0;
  let waveTimer: ReturnType<typeof setInterval> | undefined;
  const stopWaveAnimation = () => {
    if (waveTimer !== undefined) {
      clearInterval(waveTimer);
      waveTimer = undefined;
    }
  };
  // SB-34-04: prefers-reduced-motion pins the decorative wave frame —
  // it must never stop the world. This timer drives the simulation,
  // serfs, AI, and autosave, not just waves; on a phone with Reduce
  // Motion enabled the old gate froze the entire game.
  let reducedMotionActive = false;
  const syncWaveAnimation = () => {
    reducedMotionActive =
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.dataset.serfboundMotion = reducedMotionActive ? "reduced" : "full";
    // A running lockstep session must keep pumping even in a hidden
    // tab — the peer's simulation waits on our turn bundles (the
    // browser may still throttle the cadence; lockstep holds safely).
    const multiplayerRunning =
      currentMultiplayer !== undefined && currentMultiplayer.status.phase === "running";
    const shouldRun =
      currentLandscapeAssets !== undefined &&
      (!root.ownerDocument.hidden || multiplayerRunning);
    if (!shouldRun) {
      stopWaveAnimation();
      return;
    }

    // Wave frames advance every 8 ticks in the reference; ticking by 8 every
    // 175ms reproduces the original cadence without per-frame rebuilds. The
    // same driver advances the simulation clock and interim construction.
    waveTimer ??= setInterval(() => {
      if (!reducedMotionActive && (currentLandscapeAssets?.waveFrameCount ?? 0) > 0) {
        currentTick = (currentTick + 8) % 1024;
      }
      if (
        currentWorld !== undefined &&
        root.dataset.serfboundGameState === "running" &&
        gameSpeedMultiplier > 0
      ) {
        if (currentOnline !== undefined) {
          // Online correspondence: same window discipline as async,
          // with the deployed mailbox as the transport (SB-29-04).
          currentOnline.tick(16);
          const onlineMatch = currentOnline.match;
          currentWorld = onlineMatch.world;
          currentSerfEngine = onlineMatch.serfEngine;
          const onlineStatus = currentOnline.status;
          if (onlineStatus.mode === "awaiting-move" || onlineStatus.mode === "posting") {
            setNotice(uiText("notice.waiting"));
          } else if (onlineStatus.mode === "move-arrived") {
            setNotice(uiText("notice.moveArrived"));
          } else if (onlineStatus.mode === "recap") {
            setNotice(uiText("notice.recapWatching"));
          } else if (
            onlineStatus.mode === "your-window" &&
            root.dataset.serfboundNotification !== uiText("notice.yourWindow")
          ) {
            setNotice(uiText("notice.yourWindow"));
          }

          syncOnlineMatchState();
          syncWorldState(root, currentWorld);
        } else if (currentAsync !== undefined && currentAsync.match !== undefined) {
          // Async correspondence: this tab plays only its own windows;
          // between them it waits (or recaps the opponent's move).
          currentAsync.tick(16);
          const match = currentAsync.match;
          currentWorld = match.world;
          currentSerfEngine = match.serfEngine;
          const status = currentAsync.status;
          if (status.mode === "awaiting-move") {
            setNotice(uiText("notice.waiting"));
          } else if (status.mode === "move-arrived") {
            setNotice(uiText("notice.moveArrived"));
          } else if (status.mode === "recap") {
            setNotice(uiText("notice.recapWatching"));
          } else if (
            status.mode === "your-window" &&
            root.dataset.serfboundNotification !== uiText("notice.yourWindow")
          ) {
            setNotice(uiText("notice.yourWindow"));
          }

          syncAsyncState();
          syncWorldState(root, currentWorld);
        } else if (currentHotseat !== undefined) {
          // Hot-seat correspondence: the controller owns window play,
          // hand-over, and the recap; the shell renders whichever match
          // is current and keeps command authority on the active player.
          currentHotseat.tick(16);
          const renderMatch = currentHotseat.renderMatch;
          currentWorld = renderMatch.world;
          currentSerfEngine = renderMatch.serfEngine;
          currentLocalPlayer = currentHotseat.activePlayer;
          commandRouter.localPlayer = currentHotseat.activePlayer;
          if (currentHotseat.mode === "handover") {
            setNotice(
              uiText("notice.hotseatPickup", {
                player: currentHotseat.activePlayer + 1,
                seconds: currentHotseat.countdownSeconds ?? 0,
              }),
            );
          } else if (currentHotseat.mode === "recap") {
            lastHotseatMode = "recap";
            setNotice(
              uiText("notice.hotseatRecap", { player: currentHotseat.activePlayer + 1 }),
            );
          } else if (currentHotseat.mode === "your-window" && lastHotseatMode === "recap") {
            lastHotseatMode = "your-window";
            setNotice(
              uiText("notice.hotseatYourWindow", { player: currentHotseat.activePlayer + 1 }),
            );
          }

          syncHotseatState();
          syncWorldState(root, currentWorld);
        } else if (
          currentMultiplayer !== undefined &&
          currentMultiplayer.status.phase === "running" &&
          currentSerfEngine !== undefined
        ) {
          // Lockstep mode: the session pump owns tick advancement (it
          // holds at turn boundaries whose inputs are missing) and runs
          // the engine at fixed 16-tick boundaries so both peers update
          // identically. Speed stays at 1x — peers must consume turns
          // at the same rate.
          currentMultiplayer.pump({
            state: commandRouter.state,
            world: currentWorld,
            engine: currentSerfEngine,
            deltaTicks: 8,
          });
          syncWorldState(root, currentWorld);
          syncMultiplayerState();
        } else {
        for (let step = 0; step < 8 * gameSpeedMultiplier; step += 1) {
          commandRouter.state.advanceTick();
        }

        if (currentSerfEngine !== undefined) {
          for (const ai of currentAiPlayers) {
            ai.update(commandRouter.state.tick);
          }

          if (currentSerfEngine.onProduct === undefined) {
            let lastWorkSfxAt = 0;
            currentSerfEngine.onProduct = (_buildingTypeValue, product) => {
              const now = Date.now();
              if (now - lastWorkSfxAt < 700) {
                return;
              }

              const clip = productionSfx[product];
              if (clip !== undefined) {
                lastWorkSfxAt = now;
                audioService.playSfx(clip);
              }
            };
          }

          currentSerfEngine.update(commandRouter.state.tick);
          syncWorldState(root, currentWorld);

          // Notifications: surface completed buildings and defeat.
          if (currentWorld !== undefined) {
            const doneCount = [...currentWorld.buildings.values()].filter(
              (building) => building.isDone,
            ).length;
            if (doneCount > lastDoneBuildingCount && lastDoneBuildingCount > 0) {
              setNotice(uiText("notice.buildingComplete"));
              audioService.playSfx(sfxType.hammerBlow);
              syncAudioState();
            }

            lastDoneBuildingCount = doneCount;
            if (currentWorld.players[0]?.defeated === true) {
              if (root.dataset.serfboundNotification !== uiText("notice.gameOver")) {
                audioService.playSfx(sfxType.ahhh);
                syncAudioState();
              }

              setNotice(uiText("notice.gameOver"));
            }

            // The campaign ledger (SB-30-02): a mission victory
            // writes itself — every rival's castle fallen, yours
            // standing. A local game record, like the saves.
            if (
              initMission !== undefined &&
              currentProfile.missionsCompleted?.includes(initMission) !== true
            ) {
              const players = currentWorld.players as readonly { defeated?: boolean }[];
              const rivals = players.slice(1);
              if (
                rivals.length > 0 &&
                rivals.every((rival) => rival.defeated === true) &&
                players[0]?.defeated !== true
              ) {
                saveProfile(withMissionCompleted(currentProfile, initMission));
              }
            }
          }
        }
        }

        // Autosave the running session every 512 ticks.
        if (commandRouter.state.tick - lastAutosaveTick >= 512) {
          lastAutosaveTick = commandRouter.state.tick;
          const snapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
          if (snapshot !== undefined) {
            currentLocalGameSnapshot = snapshot;
            autosaveCount += 1;
            root.dataset.serfboundAutosaveCount = String(autosaveCount);
            void saveCurrentLocalGame(root, localGameSaveStore, snapshot, (record) => {
              currentSavedLocalGame = record;
              syncLocalGameSaveControls(
                root,
                currentLocalGameSnapshot,
                currentSavedLocalGame,
                currentImportedDataSource,
              );
            });
          }
        }

        root.dataset.serfboundGameTick = String(commandRouter.state.tick);
        root.dataset.serfboundSerfCount = String(
          currentSerfEngine === undefined ? 0 : currentSerfEngine.serfs.size,
        );

      }

      // The dev ledger's visible heartbeat (SB-34-04): on a device,
      // "do flags wave" splits into sim tick vs wave frame vs motion
      // preference at a glance.
      const pulseElement = root.querySelector("[data-testid='pulse-state']");
      if (pulseElement !== null) {
        pulseElement.textContent =
          `tick ${commandRouter.state.tick} · wave ${currentTick} · motion ` +
          (reducedMotionActive ? "reduced" : "full");
      }

      renderCurrentScene();
    }, 175);
  };
  root.ownerDocument.addEventListener("visibilitychange", syncWaveAnimation);
  if (typeof globalThis.matchMedia === "function") {
    globalThis
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener?.("change", syncWaveAnimation);
  }
  const startLandscapeRendering = (game: { landscape(): Parameters<typeof buildLandscapeRenderAssets>[1] }) => {
    if (currentDecodedAssets === undefined) {
      currentLandscapeAssets = undefined;
      syncWaveAnimation();
      return;
    }

    currentLandscapeAssets = buildLandscapeRenderAssets(currentDecodedAssets, game.landscape()) ?? undefined;
    // Decoded UI chrome status (SB-16-01): glyph and icon counts.
    if (currentLandscapeAssets !== undefined) {
      root.dataset.serfboundUiArt =
        `glyphs:${currentLandscapeAssets.uiGlyphCount},icons:${currentLandscapeAssets.uiIconCount}`;
    } else {
      delete root.dataset.serfboundUiArt;
    }

    currentScroll = { column: 0, row: 0 };
    currentTick = 0;
    syncWaveAnimation();
  };
  const renderGeneratedScene = () => {
    currentTypedAssetCatalog = undefined;
    currentDecodedAssets = undefined;
    currentLandscapeAssets = undefined;
    currentScroll = { column: 0, row: 0 };
    currentTick = 0;
    stopWaveAnimation();
    currentWorld = undefined;
    currentSerfEngine = undefined;
    currentImportedDataSource = undefined;
    currentBuiltStructures = [];
    currentLocalGameSnapshot = undefined;
    selectedInteraction = undefined;
    commandRouter = new SerfboundCommandRouter();
    root.dataset.serfboundActiveDataSource = "none";
    root.dataset.serfboundCommandState = "idle";
    root.dataset.serfboundCommandLogLength = "0";
    root.dataset.serfboundBuiltStructureCount = "0";
    delete root.dataset.serfboundCommandId;
    delete root.dataset.serfboundCommandReason;
    delete root.dataset.serfboundCommandType;
    delete root.dataset.serfboundLastBuiltStructure;
    getCommandStateElement(root).textContent = "No action selected";
    getCommandDetailElement(root).textContent = "Select a tile to inspect available actions.";
    getBuildFlagButton(root).disabled = true;
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    syncCommunityMapsState();
    renderCurrentScene();
  };
  const renderCatalogScene = (
    typedAssetCatalog: TypedAssetCatalog,
    catalog: DosPaCatalog,
    archiveName: string,
    archiveBytes: ArrayBuffer | ArrayBufferView,
  ) => {
    currentTypedAssetCatalog = typedAssetCatalog;
    currentDecodedAssets = buildDecodedRenderAssets(archiveBytes, catalog) ?? undefined;
    if (currentDecodedAssets !== undefined) {
      audioService.loadClips(currentDecodedAssets.rawSfx);
      audioService.loadMusic(currentDecodedAssets.rawMusic);
    }
    syncAudioState();
    currentImportedDataSource = localGameDataSourceFromCatalog(catalog, archiveName);
    root.dataset.serfboundActiveDataSource = "imported-dos-pa";
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    syncCommunityMapsState();
    renderCurrentScene();
  };

  const activateLicensedPackage = (
    record: StoredLicensedAssetPackageRecord,
    licensedPackage: LicensedAssetPackage,
    state: "restored" | "downloaded",
    cacheState: "persisted" | "error",
  ): boolean => {
    const decodedAssets = buildDecodedRenderAssetsFromLicensedPackage(licensedPackage);
    if (decodedAssets === null) {
      root.dataset.serfboundLicensedAssetState = "error";
      root.dataset.serfboundRecoverableState = "licensed-package-error";
      root.dataset.serfboundStorageMessage =
        "Licensed asset package did not contain usable runtime terrain.";
      if (currentImportedDataSource === undefined) {
        getDataStateElement(root).textContent = "Licensed package unavailable";
        getDataDetailElement(root).textContent = "Import SPAU.PA to start.";
        setSourceState(root, "No data");
        syncGameReadiness(root);
      }
      return false;
    }

    currentTypedAssetCatalog = undefined;
    currentDecodedAssets = decodedAssets;
    currentLandscapeAssets = undefined;
    currentScroll = { column: 0, row: 0 };
    currentTick = 0;
    audioService.loadClips(decodedAssets.rawSfx);
    audioService.loadMusic(decodedAssets.rawMusic);
    syncAudioState();
    currentImportedDataSource = localGameDataSourceFromLicensedPackage(record);
    root.dataset.serfboundDataState = "supported";
    root.dataset.serfboundCatalogState = "parsed";
    root.dataset.serfboundStorageState = cacheState === "persisted" ? "persisted" : "error";
    root.dataset.serfboundRecoverableState = cacheState === "persisted" ? "none" : "storage-error";
    root.dataset.serfboundLicensedAssetState = state;
    root.dataset.serfboundLicensedAssetCache = cacheState;
    root.dataset.serfboundLicensedAssetChecksum = record.packageChecksum.value;
    root.dataset.serfboundActiveDataSource = "licensed-asset-package";
    getDataStateElement(root).textContent = "Licensed package ready";
    getDataDetailElement(root).textContent =
      state === "restored"
        ? `${record.archiveName} package restored with ${record.definedArchiveEntries} resources.`
        : `${record.archiveName} package downloaded and cached.`;
    setSourceState(root, "Licensed package");
    syncGameReadiness(root);
    setResetEnabled(root, true);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    syncCommunityMapsState();
    renderCurrentScene();
    return true;
  };

  const loadConfiguredLicensedAssetPackage = async (): Promise<void> => {
    const importedDataTookPriority = () => {
      const importedDataHasRecoveryPriority =
        currentImportedDataSource !== undefined || root.dataset.serfboundStorageState === "error";
      if (!importedDataHasRecoveryPriority) {
        return false;
      }

      if (root.dataset.serfboundLicensedAssetState === "loading") {
        root.dataset.serfboundLicensedAssetState = "configured";
      }
      return true;
    };

    if (
      importedDataTookPriority() ||
      (licensedAssetDelivery === null && !discoverLicensedAssetManifest)
    ) {
      return;
    }

    root.dataset.serfboundLicensedAssetState = "loading";
    const deliveryConfig =
      licensedAssetDelivery ??
      (discoverLicensedAssetManifest
        ? await resolveLicensedAssetDeliveryManifest(undefined, fetchLicensedAssetPackage)
        : null);
    if (importedDataTookPriority()) {
      return;
    }

    const result = await loadLicensedAssetPackage(
      deliveryConfig,
      licensedAssetPackageStore,
      fetchLicensedAssetPackage,
    );
    if (importedDataTookPriority()) {
      return;
    }

    if (result.state === "not-configured") {
      root.dataset.serfboundLicensedAssetState = "not-configured";
      return;
    }

    if (result.state === "error") {
      root.dataset.serfboundLicensedAssetState = "error";
      root.dataset.serfboundRecoverableState = "licensed-package-error";
      root.dataset.serfboundStorageMessage = result.message;
      if (currentImportedDataSource === undefined) {
        getDataStateElement(root).textContent = "Licensed package unavailable";
        getDataDetailElement(root).textContent = "Import SPAU.PA to start.";
        setSourceState(root, "No data");
        syncGameReadiness(root);
      }
      return;
    }

    if (result.cacheState === "error") {
      root.dataset.serfboundStorageMessage = result.message;
    }
    activateLicensedPackage(result.record, result.licensedPackage, result.state, result.cacheState);
  };

  // The road builder (SB-34-08, the reference interface): the path
  // under construction as consecutive map positions, start flag first.
  let roadBuilderPath: number[] | undefined;
  const setRoadMode = (mode: "idle" | "awaiting-start" | "building") => {
    root.dataset.serfboundRoadMode = mode;
    if (mode === "idle") {
      roadBuilderPath = undefined;
    }
  };
  const roadDirectionCycle = [
    "Right",
    "DownRight",
    "Down",
    "Left",
    "UpLeft",
    "Up",
  ] as const;
  const tileForPosition = (
    position: number,
  ): { column: number; row: number; position: number } => ({
    column: currentWorld === undefined ? 0 : position % currentWorld.columns,
    row: currentWorld === undefined ? 0 : Math.trunc(position / currentWorld.columns),
    position,
  });
  const beginRoadBuilding = (position: number) => {
    roadBuilderPath = [position];
    setRoadMode("building");
    setNotice(uiText("notice.roadExtendHint"));
    getCommandStateElement(root).textContent = "Build road";
    getCommandDetailElement(root).textContent =
      "Tap to extend; tap the end to raise a flag; tap back to undo.";
  };
  // Lay the drawn path as a real road (explicit directions — the world
  // validates them like any road).
  const completeRoad = (): boolean => {
    const path = roadBuilderPath;
    const world = currentWorld;
    if (path === undefined || path.length < 2 || world === undefined) {
      return false;
    }

    const directions: (typeof roadDirectionCycle)[number][] = [];
    for (let step = 0; step + 1 < path.length; step += 1) {
      const direction = roadDirectionCycle.find(
        (candidate) => world.move(path[step]!, candidate) === path[step + 1]!,
      );
      if (direction === undefined) {
        return false;
      }

      directions.push(direction);
    }

    const result = commandRouter.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileForPosition(path[0]!),
      toTile: tileForPosition(path[path.length - 1]!),
      directions,
    });
    setNotice(uiText(result.status === "accepted" ? "notice.roadBuilt" : "notice.roadFailed"));
    applyCommandResultState(root, result);
    if (result.status === "accepted") {
      setRoadMode("idle");
      setGameSpeed(1);
      if (currentSerfEngine !== undefined && currentWorld !== undefined) {
        for (const building of currentWorld.buildings.values()) {
          if (!building.isDone) {
            currentSerfEngine.dispatchConstructionLogistics(building, commandRouter.state.tick);
          }
        }
      }

      currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
      syncWorldState(root, currentWorld);
      syncLocalGameSaveControls(
        root,
        currentLocalGameSnapshot,
        currentSavedLocalGame,
        currentImportedDataSource,
      );
    }

    return result.status === "accepted";
  };
  setRoadMode("idle");
  setGameSpeed(1);

  renderGeneratedScene();
  observeSceneResize(canvas, renderCurrentScene);

  // Dev god-mode building editor (SB-44): highlight / move / replace / delete /
  // place buildings on the live map. Self-contained overlay; reuses the live
  // world + view handles. Its launcher only shows once a world is running.
  mountBuildingEditor(root, {
    canvas,
    getWorld: () => currentWorld,
    getView: () =>
      currentLandscapeAssets === undefined
        ? undefined
        : { landscape: currentLandscapeAssets.landscape, scroll: currentScroll, worldScale: effectiveWorldScale() },
    getPlayer: () => currentLocalPlayer,
    getTick: () => commandRouter.state.tick,
    requestRender: renderCurrentScene,
  });

  attachPointerMapInteraction(root, canvas, {
    commandRouter: () => commandRouter,
    landscapeContext: () =>
      currentLandscapeAssets === undefined
        ? undefined
        : { landscape: currentLandscapeAssets.landscape, scroll: currentScroll },
    worldCastlePending: () =>
      currentWorld !== undefined &&
      root.dataset.serfboundGameState === "running" &&
      currentWorld.players[currentLocalPlayer]?.hasCastle === false,
    panelClick(interaction) {
      // The start screen owns setup-state canvas clicks: seed randomizes,
      // supplies cycle, START begins the seeded custom game.
      if (currentWorld === undefined && initScreenSettings() !== undefined) {
        const uiScale = uiScaleFor({ width: canvas.width, height: canvas.height }, canvasPixelRatio);
        const rect = initScreenRect({ width: canvas.width, height: canvas.height }, uiScale);
        const row = initScreenRowAt(rect, uiScale, interaction.screen.x, interaction.screen.y);
        if (row === "seed" && initMission === undefined) {
          initSeedString = randomSeedString(Math.random);
        } else if (row === "supplies" && initMission === undefined) {
          initSupplies = nextSupplies(initSupplies);
        } else if (row === "mission") {
          // Cycle CUSTOM -> the campaign missions -> CUSTOM.
          const startable = serfboundMissions.filter(
            (mission) => mission.name !== "PYRDACOR",
          );
          if (initMission === undefined) {
            initMission = startable[0]?.name;
          } else {
            const index = startable.findIndex((mission) => mission.name === initMission);
            initMission = startable[index + 1]?.name;
          }
        } else if (row === "start") {
          if (initMission === undefined) {
            startGameNowRef?.({ seedString: initSeedString, initialSupplies: initSupplies });
          } else {
            startGameNowRef?.({ mission: initMission });
          }

          return true;
        }

        if (row !== null) {
          renderCurrentScene();
          return true;
        }

        return false;
      }

      if (currentWorld === undefined || currentLandscapeAssets === undefined) {
        return false;
      }

      // An open popup owns the pointer above the map: build items place
      // buildings at the selected tile, the flip button cycles pages, the
      // sett rows cycle knight occupation, anywhere else closes.
      const uiScale = uiScaleFor({ width: canvas.width, height: canvas.height }, canvasPixelRatio);
      if (currentPopup !== undefined) {
        const popup = popupRect({ width: canvas.width, height: canvas.height }, uiScale);
        if (!pointInPopup(popup, interaction.screen.x, interaction.screen.y)) {
          setPopup(undefined);
          renderCurrentScene();
          return true;
        }

        if (currentPopup.startsWith("build")) {
          const hit = popupBuildItemAt(
            popup, uiScale, currentPopup, interaction.screen.x, interaction.screen.y,
          );
          if (hit === "flip") {
            const pageIndex = buildPopupPageOrder.indexOf(currentPopup);
            setPopup(buildPopupPageOrder[(pageIndex + 1) % buildPopupPageOrder.length]);
          } else if (hit !== null) {
            const tile = selectedInteraction?.tile;
            if (tile !== undefined) {
              const result =
                hit.building === "flag"
                  ? commandRouter.dispatch({ type: "game.build-flag", source: "pointer", tile })
                  : commandRouter.dispatch({
                      type: "game.build-building",
                      source: "pointer",
                      tile,
                      buildingKind: buildingKindNameOf(hit.building),
                    });
              if (
                result.status === "accepted" &&
                hit.building !== "flag" &&
                currentSerfEngine !== undefined
              ) {
                const newest = [...currentWorld.buildings.values()].reduce((a, b) =>
                  a.index > b.index ? a : b,
                );
                currentSerfEngine.dispatchConstructionLogistics(newest, commandRouter.state.tick);
              }

              currentLocalGameSnapshot = refreshLocalGameSnapshot(
                currentLocalGameSnapshot,
                commandRouter,
              );
              applyCommandResultState(root, result);
              syncWorldState(root, currentWorld);
              setPopup(undefined);
            }
          }
        } else if (currentPopup === "sett") {
          const toggle = settAudioToggleAt(popup, uiScale, interaction.screen.x, interaction.screen.y);
          if (toggle === "sfx") {
            audioService.sfxMuted = !audioService.sfxMuted;
          } else if (toggle === "music") {
            audioService.musicMuted = !audioService.musicMuted;
            if (audioService.musicMuted) {
              audioService.stopMusic();
            } else if (audioService.musicState === "ready") {
              audioService.playMusic();
            }
          }

          if (toggle !== null) {
            try {
              saveAudioSettings(globalThis.localStorage, audioService.settings());
            } catch {
              // In-memory only without storage.
            }

            root.dataset.serfboundSfxMuted = String(audioService.sfxMuted);
            root.dataset.serfboundMusicMuted = String(audioService.musicMuted);
            syncAudioState();
          }

          const row = settOccupationRowAt(popup, uiScale, interaction.screen.x, interaction.screen.y);
          const player = currentWorld.players[0];
          if (toggle === null && row !== null && player !== undefined) {
            const cycle = knightOccupationCycle;
            const index = cycle.indexOf(player.knightOccupation[row] ?? cycle[0]!);
            player.knightOccupation[row] = cycle[(index + 1) % cycle.length]!;
          }
        } else if (currentPopup === "map") {
          // Click-to-navigate: center the viewport on the clicked tile.
          const target = minimapTileAt(
            popup, uiScale, interaction.screen.x, interaction.screen.y,
            currentWorld.columns, currentWorld.rows,
          );
          if (target !== null) {
            currentScroll = { column: target.column, row: target.row };
          }
        }

        renderCurrentScene();
        return true;
      }

      const rect = panelBarRect({ width: canvas.width, height: canvas.height }, uiScale);
      if (!pointInPanelBar(rect, interaction.screen.x, interaction.screen.y)) {
        return false;
      }

      const slot = panelButtonAt(rect, uiScale, interaction.screen.x, interaction.screen.y);
      // Road-building owns the bar (reference IsBuildingRoad layout):
      // the starred slot 0 cancels; every other slot is inert.
      if (root.dataset.serfboundRoadMode !== "idle" && root.dataset.serfboundRoadMode !== undefined) {
        if (slot === 0) {
          setRoadMode("idle");
          setGameSpeed(1);
          setNotice(uiText("notice.roadEnded"));
          getCommandStateElement(root).textContent = "Road mode ended";
          getCommandDetailElement(root).textContent =
            "Select a tile to inspect available actions.";
          audioService.playSfx(sfxType.click);
        }

        renderCurrentScene();
        return true;
      }

      if (slot === 0) {
        // Build: place the castle directly during founding; on an own
        // flag the build act is a road from it (SB-34 round 4, the
        // reference flow); with a castle standing, the build popup
        // offers the building menu.
        const possibility = computeBuildPossibility();
        const tile = selectedInteraction?.tile;
        if (tile !== undefined && possibility === "castle") {
          const result = commandRouter.dispatch({
            type: "game.build-castle",
            source: "pointer",
            tile,
          });
          applyCommandResultState(root, result);
          syncWorldState(root, currentWorld);
        } else if (possibility === "road" && selectedInteraction !== undefined) {
          // The road builder starts at the selected flag (SB-34-08).
          beginRoadBuilding(selectedInteraction.tile.position);
          audioService.playSfx(sfxType.click);
        } else if (currentWorld.players[0]?.hasCastle === true) {
          setPopup("buildBasic");
        }
      } else if (slot === 2) {
        setPopup("map");
        audioService.playSfx(sfxType.click);
      } else if (slot === 3) {
        setPopup("stats");
        audioService.playSfx(sfxType.click);
      } else if (slot === 4) {
        setPopup("sett");
        audioService.playSfx(sfxType.click);
      } else if (slot === 1) {
        // Road mode toggle, same semantics as the shell road button.
        if (root.dataset.serfboundRoadMode !== "idle") {
          setRoadMode("idle");
  setGameSpeed(1);
          setNotice(uiText("notice.roadEnded"));
          getCommandStateElement(root).textContent = "Road mode ended";
          getCommandDetailElement(root).textContent =
            "Select a tile to inspect available actions.";
        } else {
          setRoadMode("awaiting-start");
          setNotice(uiText("notice.roadPickStart"));
          getCommandStateElement(root).textContent = "Build road";
          getCommandDetailElement(root).textContent = "Select the starting flag.";
        }
      }

      renderCurrentScene();
      return true;
    },
    roadModeClick(interaction) {
      const mode = root.dataset.serfboundRoadMode;
      if (currentWorld === undefined || mode === "idle" || mode === undefined) {
        return false;
      }

      const position = interaction.tile.position;
      if (mode === "awaiting-start") {
        const flag = currentWorld.flagAt(position);
        if (flag !== null && flag.player === currentLocalPlayer) {
          beginRoadBuilding(position);
          audioService.playSfx(sfxType.click);
        } else {
          setNotice(uiText("notice.roadPickStart"));
        }

        renderCurrentScene();
        return true;
      }

      // The road builder (SB-34-08, reference semantics): tap extends
      // the path toward the tap; tapping the previous tile undoes a
      // segment; tapping the end raises a flag there and lays the
      // road; reaching an own flag lays the road to it.
      const path = roadBuilderPath;
      if (path === undefined || path.length === 0) {
        setRoadMode("idle");
        return true;
      }

      const end = path[path.length - 1]!;
      if (position === end) {
        if (path.length === 1) {
          renderCurrentScene();
          return true;
        }

        const flagResult = commandRouter.dispatch({
          type: "game.build-flag",
          source: "pointer",
          tile: tileForPosition(end),
        });
        if (flagResult.status !== "accepted") {
          setNotice(uiText("notice.roadFailed"));
          applyCommandResultState(root, flagResult);
          renderCurrentScene();
          return true;
        }

        audioService.playSfx(sfxType.accepted);
        completeRoad();
        renderCurrentScene();
        return true;
      }

      if (path.length > 1 && position === path[path.length - 2]) {
        path.pop();
        audioService.playSfx(sfxType.click);
        renderCurrentScene();
        return true;
      }

      // The original's stepwise build: a tap on a tile adjacent to the
      // end extends exactly that one segment (reference Viewport click
      // → direction; rejected if that single segment is invalid). A
      // distant tap pathfinds toward it — the modern convenience.
      const world = currentWorld;
      const isAdjacent = roadDirectionCycle.some(
        (candidate) => world.move(end, candidate) === position,
      );
      const found = findShortestRoad(
        currentWorld,
        end,
        position,
        isAdjacent ? { maxLength: 1 } : {},
      );
      const extension: number[] = [];
      if (found !== null) {
        let walker = end;
        for (const direction of found.directions) {
          walker = currentWorld.move(walker, direction);
          extension.push(walker);
        }
      }

      if (found === null || extension.some((step) => path.includes(step))) {
        setNotice(uiText("notice.roadNoPath"));
        renderCurrentScene();
        return true;
      }

      path.push(...extension);
      const flag = currentWorld.flagAt(position);
      if (flag !== null && flag.player === currentLocalPlayer) {
        audioService.playSfx(sfxType.accepted);
        completeRoad();
      } else {
        audioService.playSfx(sfxType.click);
        setNotice(uiText("notice.roadFlagHint"));
      }

      renderCurrentScene();
      return true;
    },
    onWorldChanged() {
      syncWorldState(root, currentWorld);
      renderCurrentScene();
    },
    onSelection(interaction) {
      selectedInteraction = interaction;
      syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
      // The map cursor draws at the selection — repaint immediately so
      // the tap lands visibly, not on the next animation tick.
      renderCurrentScene();
    },
    onNotice(notice) {
      setNotice(notice);
      renderCurrentScene();
    },
  });

  // Landscape scrolling: arrow keys step by whole tiles; dragging the canvas
  // pans by accumulated tile steps (the original scrolls in full columns/rows).
  root.ownerDocument.addEventListener("keydown", (event) => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === "0" || event.key === "1" || event.key === "2" || event.key === "4") {
      if (root.dataset.serfboundGameState === "running") {
        setGameSpeed(Number(event.key));
        return;
      }
    }

    // 'v' cycles the world view scale (1x/2x/3x — the modern SVGA).
    if (event.key === "v" || event.key === "V") {
      cycleWorldViewScale();
      renderCurrentScene();
      return;
    }

    // Correspondence: Enter picks an arrived turn up (online match,
    // async match, or hot-seat hand-over).
    if (event.key === "Enter" && currentOnline !== undefined) {
      event.preventDefault();
      currentOnline.pickup();
      return;
    }

    if (event.key === "Enter" && currentAsync !== undefined) {
      event.preventDefault();
      currentAsync.pickup();
      return;
    }

    if (event.key === "Enter" && currentHotseat !== undefined) {
      event.preventDefault();
      currentHotseat.pickup();
      return;
    }

    // Keyboard play: Enter starts the configured game from the title
    // screen (the pointer-free path to the same custom/mission start).
    if (event.key === "Enter" && currentWorld === undefined && initScreenSettings() !== undefined) {
      event.preventDefault();
      if (initMission === undefined) {
        startGameNowRef?.({ seedString: initSeedString, initialSupplies: initSupplies });
      } else {
        startGameNowRef?.({ mission: initMission });
      }

      return;
    }

    const scrollKeys: Record<string, readonly [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = scrollKeys[event.key];
    if (delta === undefined) {
      return;
    }

    event.preventDefault();
    applyScroll(delta[0], delta[1]);
  });

  let dragState: { x: number; y: number } | undefined;
  // CSS pixels per tile step at the current scales (drag and two-finger
  // pan share it).
  const tileStepCss = () => ({
    x: (32 * effectiveWorldScale()) / canvasPixelRatio,
    y: (20 * effectiveWorldScale()) / canvasPixelRatio,
  });
  // Pinch zoom keeps the map point under the gesture midpoint
  // stationary: compare the tile under the midpoint before and after
  // the scale step (scroll-independent, so scroll {0,0} suffices).
  const stepViewScaleAt = (direction: 1 | -1, clientX: number, clientY: number): void => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    const landscape = currentLandscapeAssets.landscape;
    const rect = canvas.getBoundingClientRect();
    const screen = {
      x: (clientX - rect.left) * (rect.width === 0 ? 1 : canvas.width / rect.width),
      y: (clientY - rect.top) * (rect.height === 0 ? 1 : canvas.height / rect.height),
    };
    const origin = { column: 0, row: 0 };
    const before = screenToMapTile(landscape, screen, origin, effectiveWorldScale());
    const after = screenToMapTile(landscape, screen, origin, stepWorldViewScale(direction));
    const wrapDelta = (delta: number, size: number) => {
      const wrapped = ((delta % size) + size) % size;
      return wrapped > size / 2 ? wrapped - size : wrapped;
    };
    applyScroll(
      wrapDelta(before.column - after.column, landscape.columns),
      wrapDelta(before.row - after.row, landscape.rows),
    );
  };
  let panRemainder = { x: 0, y: 0 };
  canvas.addEventListener("pointerdown", (event) => {
    // The map editor owns the canvas while open (SB-42-05).
    if (root.dataset.serfboundEditor === "open") {
      return;
    }
    audioService.unlock();
    if (audioService.musicState === "ready") {
      audioService.playMusic();
    }

    syncAudioState();
    gestureTracker.down(event.pointerId, event.clientX, event.clientY);
    if (currentLandscapeAssets !== undefined) {
      if (gestureTracker.pointerCount === 1) {
        dragState = { x: event.clientX, y: event.clientY };
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // synthetic pointers (tests) have no capturable device
        }
      } else {
        // A second finger turns the interaction into a gesture.
        dragState = undefined;
        panRemainder = { x: 0, y: 0 };
      }
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (root.dataset.serfboundEditor === "open") {
      return;
    }
    if (currentLandscapeAssets === undefined) {
      gestureTracker.move(event.pointerId, event.clientX, event.clientY);
      return;
    }

    // Two-finger gestures: pan by the midpoint, pinch to step the view
    // scale.
    if (gestureTracker.pointerCount >= 2) {
      const step = tileStepCss();
      for (const action of gestureTracker.move(event.pointerId, event.clientX, event.clientY)) {
        if (action.kind === "pan") {
          panRemainder = { x: panRemainder.x + action.deltaX, y: panRemainder.y + action.deltaY };
          const columnSteps = Math.trunc(panRemainder.x / step.x);
          const rowSteps = Math.trunc(panRemainder.y / step.y);
          if (columnSteps !== 0 || rowSteps !== 0) {
            panRemainder = {
              x: panRemainder.x - columnSteps * step.x,
              y: panRemainder.y - rowSteps * step.y,
            };
            applyScroll(-columnSteps, -rowSteps);
          }
        } else {
          stepViewScaleAt(action.direction, action.centerX, action.centerY);
          renderCurrentScene();
        }
      }

      return;
    }

    gestureTracker.move(event.pointerId, event.clientX, event.clientY);
    if (dragState === undefined) {
      return;
    }

    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    // Drag deltas arrive in CSS pixels; one tile spans
    // tileSize * worldScale device pixels = that / pixelRatio CSS pixels.
    const step = tileStepCss();
    const columnSteps = Math.trunc(deltaX / step.x);
    const rowSteps = Math.trunc(deltaY / step.y);
    if (columnSteps !== 0 || rowSteps !== 0) {
      dragState = {
        x: dragState.x + columnSteps * step.x,
        y: dragState.y + rowSteps * step.y,
      };
      applyScroll(-columnSteps, -rowSteps);
    }
  });
  const endDrag = (event: PointerEvent) => {
    gestureTracker.up(event.pointerId);
    dragState = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const input = root.querySelector<HTMLInputElement>("[data-testid='data-import-input']");
  if (input === null) {
    throw new Error("Serfbound shell import input did not mount.");
  }

  // One import path for the picker and the welcome drop zone
  // (SB-32-03): same validation, same recovery, designed states.
  const welcomeDropZone = root.querySelector<HTMLElement>("[data-testid='welcome-drop-zone']");
  const welcomeError = root.querySelector<HTMLElement>("[data-testid='welcome-error']");
  const applyImportFile = (file: File | null | undefined) => {
    const validation = validateArchiveFileSelection(file);
    applyArchiveValidation(root, validation, renderGeneratedScene);
    if (welcomeError !== null) {
      welcomeError.hidden = validation.state !== "unsupported";
      welcomeError.textContent =
        validation.state === "unsupported"
          ? `${validation.fileName} cannot be used. Choose SPAU.PA to start.`
          : "";
    }

    if (validation.state === "supported" && file !== null && file !== undefined) {
      welcomeDropZone?.classList.add("is-busy");
      void importSelectedArchive(
        root,
        file,
        validation,
        importedArchiveStore,
        renderCatalogScene,
        renderGeneratedScene,
      ).finally(() => {
        welcomeDropZone?.classList.remove("is-busy");
      });
    }
  };
  input.addEventListener("change", () => {
    applyImportFile(input.files?.item(0));
  });
  welcomeDropZone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    welcomeDropZone.classList.add("is-dragover");
  });
  welcomeDropZone?.addEventListener("dragleave", () => {
    welcomeDropZone.classList.remove("is-dragover");
  });
  welcomeDropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    welcomeDropZone.classList.remove("is-dragover");
    applyImportFile(event.dataTransfer?.files.item(0));
  });
  const importControl = root.querySelector<HTMLElement>("[data-testid='data-import-control']");
  if (importControl === null) {
    throw new Error("Serfbound shell import control did not mount.");
  }

  importControl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    input.click();
  });

  const resetButton = root.querySelector<HTMLButtonElement>("[data-testid='data-reset-button']");
  if (resetButton === null) {
    throw new Error("Serfbound shell reset button did not mount.");
  }

  resetButton.addEventListener("click", () => {
    if (root.dataset.serfboundActiveDataSource === "licensed-asset-package") {
      void clearSelectedLicensedPackage(root, licensedAssetPackageStore, renderGeneratedScene);
      return;
    }

    void clearSelectedArchive(root, importedArchiveStore, renderGeneratedScene);
  });

  const startButton = root.querySelector<HTMLButtonElement>("[data-testid='start-game-button']");
  if (startButton === null) {
    throw new Error("Serfbound shell start button did not mount.");
  }

  const startGameNow = (options: {
    seedString?: string;
    initialSupplies?: number;
    mission?: string;
    playerCount?: number;
    playerSupplies?: number[];
    multiplayerLocalPlayer?: number;
    customMap?: SerfboundCustomMap;
  }) => {
    const { multiplayerLocalPlayer, ...gameOptions } = options;
    const result =
      options.mission !== undefined && currentImportedDataSource !== undefined
        ? startSerfboundMission(options.mission, currentImportedDataSource)
        : startSerfboundLocalGame(
            currentImportedDataSource === undefined
              ? {}
              : { data: currentImportedDataSource, ...gameOptions },
          );
    if (result.status === "started") {
      currentBuiltStructures = [];
      currentLocalGameSnapshot = result.snapshot;
      startLandscapeRendering(result.game);
      commandRouter = new SerfboundCommandRouter(
        result.game.state,
        currentLandscapeAssets === undefined ? undefined : result.game.world(),
      );
      currentWorld = currentLandscapeAssets === undefined ? undefined : result.game.world();
      currentSerfEngine =
        currentLandscapeAssets === undefined ? undefined : result.game.serfEngine();
      if (multiplayerLocalPlayer !== undefined && currentMultiplayer !== undefined) {
        // Lockstep game: this tab controls one player, commands queue
        // through the session, and no AI plays the other seat.
        currentLocalPlayer = multiplayerLocalPlayer;
        commandRouter.localPlayer = multiplayerLocalPlayer;
        commandRouter.onWorldAction = (action) => currentMultiplayer?.submitAction(action);
      } else {
        currentLocalPlayer = 0;
        if (currentMultiplayer !== undefined) {
          currentMultiplayer.leave("local-game-started");
          currentMultiplayer = undefined;
        }

        attachAiPlayers(result.game);
      }

      renderCurrentScene();
    }
    applyLocalGameStartResult(root, result);
    syncWorldState(root, currentWorld);
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    syncCommunityMapsState();
  };
  startGameNowRef = startGameNow;

  // The map editor (SB-42-05): "Build a map" opens the editor over the
  // shared canvas; it renders the authentic tiles from imported data,
  // paints via the tool palette, and hands a custom-map record back to
  // the local-game start flow to play.
  let currentEditor: MapEditorScreen | undefined;
  const editorSurface = root.querySelector<HTMLElement>("[data-testid='editor-surface']");
  const closeEditor = () => {
    currentEditor?.dispose();
    currentEditor = undefined;
    delete root.dataset.serfboundEditor;
    if (editorSurface !== null) {
      editorSurface.hidden = true;
    }
    syncCommunityMapsState();
    renderCurrentScene();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='open-editor-button']")
    ?.addEventListener("click", () => {
      if (currentDecodedAssets === undefined || currentEditor !== undefined) {
        return;
      }
      const editorCanvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
      const paletteHost = root.querySelector<HTMLElement>("[data-testid='editor-tools']");
      const statusHost = root.querySelector<HTMLElement>("[data-testid='editor-status']");
      if (editorCanvas === null || paletteHost === null || statusHost === null) {
        return;
      }

      root.dataset.serfboundEditor = "open";
      if (editorSurface !== null) {
        editorSurface.hidden = false;
      }
      currentEditor = new MapEditorScreen({
        canvas: editorCanvas,
        paletteHost,
        statusHost,
        decodedAssets: currentDecodedAssets,
        authorKeyId: "local",
        authorName: currentProfile.name,
        nowIso: () => new Date().toISOString(),
        onRender: ({ spriteCount, mode }) => {
          root.dataset.serfboundSceneMode = mode;
          root.dataset.serfboundSpriteCount = String(spriteCount);
        },
        onPlay: (map) => {
          closeEditor();
          startGameNow({ customMap: map });
        },
        onExit: () => closeEditor(),
      });
      syncCommunityMapsState();
    });
  root
    .querySelector<HTMLButtonElement>("[data-testid='editor-play-button']")
    ?.addEventListener("click", () => currentEditor?.play(`${currentProfile.name}'s map`));
  root
    .querySelector<HTMLButtonElement>("[data-testid='editor-validate-button']")
    ?.addEventListener("click", () => currentEditor?.validate());
  root
    .querySelector<HTMLButtonElement>("[data-testid='editor-copy-button']")
    ?.addEventListener("click", () => currentEditor?.beginCopy());
  root
    .querySelector<HTMLButtonElement>("[data-testid='editor-paste-button']")
    ?.addEventListener("click", () => currentEditor?.beginPaste());
  root
    .querySelector<HTMLButtonElement>("[data-testid='editor-exit-button']")
    ?.addEventListener("click", () => closeEditor());

  // Loopback multiplayer (SB-22-04): host/join a two-player lockstep
  // game between two tabs of this browser over a BroadcastChannel —
  // zero servers, original data never crossing the wire.
  const syncMultiplayerState = () => {
    if (currentMultiplayer === undefined) {
      delete root.dataset.serfboundMpRole;
      delete root.dataset.serfboundMpPhase;
      return;
    }

    const status = currentMultiplayer.status;
    root.dataset.serfboundMpRole = status.role;
    root.dataset.serfboundMpPhase = status.phase;
    root.dataset.serfboundMpStalled = String(status.stalled);
    root.dataset.serfboundMpExecutedTurn = String(status.executedTurn);
    if (status.rejectReason !== null) {
      root.dataset.serfboundMpRejectReason = status.rejectReason;
    }

    if (status.lastChecksumTick !== null) {
      root.dataset.serfboundMpChecksumTick = String(status.lastChecksumTick);
      root.dataset.serfboundMpChecksumAgreed = String(status.checksumAgreed);
    }

    if (status.desyncTick !== null) {
      root.dataset.serfboundMpDesyncTick = String(status.desyncTick);
    }

    if (status.opponentName !== null) {
      root.dataset.serfboundMpOpponent = status.opponentName;
    }

    if (currentWorld !== undefined) {
      root.dataset.serfboundMpCastles = currentWorld.players
        .map((player) => (player.hasCastle ? "1" : "0"))
        .join(",");
    }
  };
  const startMultiplayer = (role: "host" | "join") => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentMultiplayer?.leave("superseded");
    currentMultiplayer = new SerfboundLoopbackMultiplayer({
      role,
      appVersion: "0.1.0",
      profileName: currentProfile.name,
      onEnded: () => {
        const defeated = currentWorld?.players[currentLocalPlayer]?.defeated === true;
        const opponentDefeated =
          currentWorld?.players[1 - currentLocalPlayer]?.defeated === true;
        recordMatchEnd(
          "realtime-loopback",
          currentMultiplayer?.status.opponentName ?? null,
          currentLocalPlayer,
          defeated ? "lost" : opponentDefeated ? "won" : "abandoned",
        );
      },
      settings: {
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
        playerSupplies: null,
      },
      onReady: (settings, localPlayer) => {
        startGameNow({
          seedString: settings.seedString,
          initialSupplies: settings.initialSupplies,
          playerCount: settings.playerCount,
          ...(settings.playerSupplies === null
            ? {}
            : { playerSupplies: [...settings.playerSupplies] }),
          multiplayerLocalPlayer: localPlayer,
        });
        syncMultiplayerState();
      },
    });
    syncMultiplayerState();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='host-loopback-button']")
    ?.addEventListener("click", () => startMultiplayer("host"));
  root
    .querySelector<HTMLButtonElement>("[data-testid='join-loopback-button']")
    ?.addEventListener("click", () => startMultiplayer("join"));
  // Hot-seat correspondence (SB-23-03): two players pass one seat;
  // every window still crosses the trustless verify path, and the
  // incoming player watches the recap before playing.
  const syncHotseatState = () => {
    if (currentHotseat === undefined) {
      delete root.dataset.serfboundCorMode;
      return;
    }

    root.dataset.serfboundCorMode = currentHotseat.mode;
    root.dataset.serfboundCorWindow = String(currentHotseat.currentWindow);
    root.dataset.serfboundCorPlayer = String(currentHotseat.activePlayer);
    const countdown = currentHotseat.countdownSeconds;
    if (countdown === null) {
      delete root.dataset.serfboundCorCountdown;
    } else {
      root.dataset.serfboundCorCountdown = String(countdown);
      root.dataset.serfboundCorExpired = String(currentHotseat.pickupExpired);
    }

    const digest = currentHotseat.lastDigest;
    if (digest !== null) {
      root.dataset.serfboundCorDigest = digestLines(digest).join(" / ");
    }

    if (currentHotseat.failureReason !== null) {
      root.dataset.serfboundCorFailure = currentHotseat.failureReason;
    }
  };
  const hotseatWindowTicks = (() => {
    try {
      const value = new URLSearchParams(globalThis.location?.search ?? "").get("window");
      const parsed = value === null ? NaN : Number(value);
      return Number.isInteger(parsed) && parsed >= 64 ? parsed : 4096;
    } catch {
      return 4096;
    }
  })();
  const startHotseat = () => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentHotseat = new HotseatController({
      game: {
        data: currentImportedDataSource,
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
      },
      windowTicks: hotseatWindowTicks,
      pickupSeconds: 60,
    });
    currentBuiltStructures = [];
    const live = currentHotseat.live;
    startLandscapeRendering({ landscape: () => live.world });
    commandRouter = new SerfboundCommandRouter(live.state, live.world);
    commandRouter.onWorldAction = (action) => currentHotseat?.queue(action);
    currentWorld = live.world;
    currentSerfEngine = live.serfEngine;
    currentLocalPlayer = 0;
    root.dataset.serfboundGameState = "running";
    getGameStateElement(root).textContent = "Running";
    setNotice(uiText("notice.hotseatYourWindow", { player: 1 }));
    syncHotseatState();
    syncWorldState(root, currentWorld);
    renderCurrentScene();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='hotseat-button']")
    ?.addEventListener("click", startHotseat);
  // Two-tab async correspondence (SB-23-04): each tab runs its own full
  // match; window moves cross the loopback channel (the Phase 24
  // mailbox's stand-in). Tabs act at their own pace.
  const syncAsyncState = () => {
    if (currentAsync === undefined) {
      return;
    }

    const status = currentAsync.status;
    root.dataset.serfboundCorMode = status.mode;
    root.dataset.serfboundCorWindow = String(status.window);
    root.dataset.serfboundCorPlayer = String(status.localPlayer);
    root.dataset.serfboundCorChecksum = String(status.checksum >>> 0);
    if (status.boundaryChecksum !== null) {
      root.dataset.serfboundCorBoundary = String(status.boundaryChecksum >>> 0);
    }

    if (status.digest !== null) {
      root.dataset.serfboundCorDigest = digestLines(status.digest).join(" / ");
    }

    if (status.failureReason !== null) {
      root.dataset.serfboundCorFailure = status.failureReason;
    }

    if (status.opponentName !== null) {
      root.dataset.serfboundCorOpponent = status.opponentName;
    }
  };
  const startAsync = (role: "host" | "join") => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentAsync = new SerfboundAsyncLoopbackMatch({
      role,
      appVersion: "0.1.0",
      profileName: currentProfile.name,
      onEnded: () => {
        recordMatchEnd(
          "async-loopback",
          currentAsync?.status.opponentName ?? null,
          currentAsync?.localPlayer ?? 0,
          "abandoned",
        );
      },
      data: currentImportedDataSource,
      windowTicks: hotseatWindowTicks,
      settings: {
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
        playerSupplies: null,
      },
      onReady: () => {
        const match = currentAsync?.match;
        if (match === undefined || currentAsync === undefined) {
          return;
        }

        currentBuiltStructures = [];
        startLandscapeRendering({ landscape: () => match.world });
        commandRouter = new SerfboundCommandRouter(match.state, match.world);
        commandRouter.localPlayer = currentAsync.localPlayer;
        commandRouter.onWorldAction = (action) => currentAsync?.queue(action);
        currentWorld = match.world;
        currentSerfEngine = match.serfEngine;
        currentLocalPlayer = currentAsync.localPlayer;
        root.dataset.serfboundGameState = "running";
        getGameStateElement(root).textContent = "Running";
        syncAsyncState();
        syncWorldState(root, currentWorld);
        renderCurrentScene();
      },
    });
    syncAsyncState();
  };
  root
    .querySelector<HTMLInputElement>("[data-testid='profile-name-input']")
    ?.addEventListener("change", (event) => {
      saveProfile(withProfileName(currentProfile, (event.target as HTMLInputElement).value));
    });
  // The identity picker (SB-30-05): the library rendered as pressable
  // choices; selection is local-first and instant.
  const avatarChoicesElement = root.querySelector<HTMLElement>("[data-testid='avatar-choices']");
  const guildChoicesElement = root.querySelector<HTMLElement>("[data-testid='guild-choices']");
  if (avatarChoicesElement !== null) {
    avatarChoicesElement.innerHTML = serfboundAvatars
      .map(
        (entry) => `
          <button
            class="identity-choice"
            type="button"
            data-avatar-id="${entry.id}"
            aria-pressed="false"
            title="${entry.name}"
            aria-label="${entry.name}"
          ><img src="${entry.src}" alt="" width="48" height="48" /></button>`,
      )
      .join("");
    avatarChoicesElement.addEventListener("click", (event) => {
      const choice = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-avatar-id]");
      const avatarId = choice?.dataset["avatarId"];
      if (avatarId !== undefined) {
        saveProfile(withAvatar(currentProfile, avatarId));
      }
    });
  }

  if (guildChoicesElement !== null) {
    guildChoicesElement.innerHTML = serfboundGuilds
      .map(
        (entry) => `
          <button
            class="identity-choice"
            type="button"
            data-guild-id="${entry.id}"
            aria-pressed="false"
            title="${entry.name}"
            aria-label="${entry.name}"
          ><img src="${entry.src}" alt="" width="48" height="48" /></button>`,
      )
      .join("");
    guildChoicesElement.addEventListener("click", (event) => {
      const choice = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-guild-id]");
      const guildId = choice?.dataset["guildId"];
      if (guildId !== undefined) {
        saveProfile(withGuild(currentProfile, guildId));
      }
    });
  }
  root
    .querySelector<HTMLButtonElement>("[data-testid='async-host-button']")
    ?.addEventListener("click", () => startAsync("host"));
  root
    .querySelector<HTMLButtonElement>("[data-testid='async-join-button']")
    ?.addEventListener("click", () => startAsync("join"));
  // The online surface (SB-29-04): sign-in, lobby, your-turn badge
  // against the deployed backbone. Strictly additive — nothing on the
  // local play path waits on, or breaks with, the network. No request
  // leaves this device until the player signs in (or restored a
  // previously linked account).
  const onlineConfig = resolveOnlineConfig(
    globalThis.location?.search ?? "",
    globalThis.localStorage,
  );
  const onlineSurface = new SerfboundOnlineSurface({
    identityUrl: onlineConfig.identityUrl,
    mailboxUrl: onlineConfig.mailboxUrl,
    onAccountLinked: (account) => saveProfile(withAccount(currentProfile, account)),
  });
  const onlineStateElement = root.querySelector<HTMLElement>("[data-testid='online-state']");
  const onlineDetailElement = root.querySelector<HTMLElement>("[data-testid='online-detail']");
  const onlineLobbyElement = root.querySelector<HTMLElement>("[data-testid='online-lobby']");
  const onlineBadgeElement = root.querySelector<HTMLElement>("[data-testid='online-your-turn']");
  const onlineSignInButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='online-signin-button']",
  );
  const onlineChallengeButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='online-challenge-button']",
  );
  const onlineAttestWinButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='online-attest-win-button']",
  );
  const onlineAttestLossButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='online-attest-loss-button']",
  );
  const onlineMatchStrip = root.querySelector<HTMLElement>("[data-testid='online-match-strip']");
  const onlineMatchLine = root.querySelector<HTMLElement>("[data-testid='online-match-line']");
  const onlineSealLabel = root.querySelector<HTMLElement>("[data-testid='online-seal-label']");
  type SignInMethod = "email" | "passkey" | "google" | "apple" | "meta";
  type SignInMomentStatus = "idle" | "working" | "ready" | "unavailable";
  const providerSignInMethods = new Set<SignInMethod>(["google", "apple", "meta"]);
  let signInMethod: SignInMethod = "email";
  let signInMomentStatus: SignInMomentStatus = "idle";
  let signInMomentMessage =
    "Choose a sign-in method when you want the social realm; local play stays open.";
  let identityV2Account: IdentityV2Account | undefined;
  const signInMethodButtons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-signin-method]"),
  ];
  const signInPanels = [...root.querySelectorAll<HTMLElement>("[data-signin-panel]")];
  const signInMomentState = root.querySelector<HTMLElement>("[data-testid='signin-moment-state']");
  const signInProviderName = root.querySelector<HTMLElement>("[data-testid='signin-provider-name']");
  const signInEmailInput = root.querySelector<HTMLInputElement>(
    "[data-testid='signin-email-input']",
  );
  const signInPasswordInput = root.querySelector<HTMLInputElement>(
    "[data-testid='signin-password-input']",
  );
  const signInEmailSubmit = root.querySelector<HTMLButtonElement>(
    "[data-testid='signin-email-submit']",
  );
  const mapsStateElement = root.querySelector<HTMLElement>("[data-testid='maps-state']");
  const mapsDetailElement = root.querySelector<HTMLElement>("[data-testid='maps-detail']");
  const mapsTitleInput = root.querySelector<HTMLInputElement>("[data-testid='maps-title-input']");
  const mapsFilterPlayers = root.querySelector<HTMLSelectElement>(
    "[data-testid='maps-filter-players']",
  );
  const mapsSort = root.querySelector<HTMLSelectElement>("[data-testid='maps-sort']");
  const mapsSigninButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='maps-signin-button']",
  );
  const mapsRefreshButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='maps-refresh-button']",
  );
  const mapsPublishButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='maps-publish-button']",
  );
  const editorPublishButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='editor-publish-button']",
  );
  const mapsGalleryElement = root.querySelector<HTMLElement>("[data-testid='maps-gallery']");
  const mapsLibraryElement = root.querySelector<HTMLElement>("[data-testid='maps-library']");
  type CommunityMapsStatus =
    | "idle"
    | "loading"
    | "ready"
    | "published"
    | "downloaded"
    | "playing"
    | "rated"
    | "reported"
    | "unavailable";
  let communityMapsStatus: CommunityMapsStatus = "idle";
  let communityMapsDetail =
    "Browse without game data; play downloaded maps with your own data.";
  let communityMapsBusy = false;
  let communityGallery: readonly MapGalleryEntry[] = [];
  let communityLibrary: readonly StoredCommunityMapRecord[] = [];
  let activeCommunityMapId: string | null = null;
  const identityV2Session = () => identityV2Account?.session;
  const communityMapsAuthMode = () =>
    identityV2Session() !== undefined
      ? "identity-v2"
      : onlineSurface.status === "signed-in" && onlineSurface.keys !== undefined
        ? "device-key"
        : "signed-out";
  const canUseSignedCommunityActions = () =>
    communityMapsAuthMode() !== "signed-out";
  const selectedPlayersFilter = () => {
    const value = mapsFilterPlayers?.value ?? "";
    const parsed = Number(value);
    return value === "" || !Number.isInteger(parsed) ? undefined : parsed;
  };
  const communityGalleryFilter = () => {
    const players = selectedPlayersFilter();
    return players === undefined ? {} : { players };
  };
  const selectedGallerySort = () => mapsSort?.value ?? "popular";
  const sortedCommunityGallery = (): readonly MapGalleryEntry[] => {
    const entries = [...communityGallery];
    const sort = selectedGallerySort();
    if (sort === "recent") {
      return entries.sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso));
    }
    if (sort === "rating") {
      return entries.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    }
    return entries.sort(
      (a, b) =>
        b.timesPlayed - a.timesPlayed ||
        b.downloads - a.downloads ||
        b.rating - a.rating ||
        b.publishedAtIso.localeCompare(a.publishedAtIso),
    );
  };
  const renderCommunityThumbnail = (thumbnail: string | null | undefined): string =>
    thumbnail === undefined || thumbnail === null || thumbnail.length === 0
      ? `<div class="community-map-thumb community-map-thumb--empty" aria-hidden="true"></div>`
      : `<img class="community-map-thumb" src="${escapeHtml(thumbnail)}" alt="" width="96" height="96" />`;
  const renderCommunityCard = (entry: MapGalleryEntry): string => {
    const signed = canUseSignedCommunityActions();
    const canPlay = currentImportedDataSource !== undefined && currentWorld === undefined;
    const title = escapeHtml(entry.title);
    const author = escapeHtml(entry.authorName);
    const mapId = escapeHtml(entry.mapId);
    const rating =
      entry.ratingCount === 0
        ? "Unrated"
        : `${entry.rating.toFixed(entry.rating % 1 === 0 ? 0 : 1)} from ${entry.ratingCount}`;
    return `
      <div class="community-map-card" data-map-id="${mapId}">
        ${renderCommunityThumbnail(entry.thumbnail)}
        <div class="community-map-card__body">
          <p class="community-map-card__title">${title}</p>
          <p class="community-map-card__meta">${author} · size ${entry.size} · ${entry.playerCount}P</p>
          <p class="community-map-card__meta">${rating} · ${entry.downloads} downloads · ${entry.timesPlayed} plays</p>
          <div class="community-map-card__actions">
            <button class="secondary-action" data-testid="maps-download-button" data-map-id="${mapId}" data-action="download" type="button">Download</button>
            <button class="primary-action" data-testid="maps-play-button" data-map-id="${mapId}" data-action="play-gallery" type="button" ${canPlay ? "" : "disabled"}>Play</button>
            <button class="secondary-action" data-testid="maps-rate-button" data-map-id="${mapId}" data-action="rate" data-stars="5" type="button" ${signed ? "" : "disabled"}>5 stars</button>
            <button class="secondary-action" data-testid="maps-report-button" data-map-id="${mapId}" data-action="report" type="button" ${signed ? "" : "disabled"}>Report</button>
          </div>
        </div>
      </div>`;
  };
  const renderCommunityLibraryCard = (record: StoredCommunityMapRecord): string => {
    const canPlay = currentImportedDataSource !== undefined && currentWorld === undefined;
    const mapId = escapeHtml(record.mapId);
    return `
      <div class="community-map-card community-map-card--library" data-map-id="${mapId}">
        ${renderCommunityThumbnail(record.view.thumbnail ?? record.map.meta.thumbnail ?? null)}
        <div class="community-map-card__body">
          <p class="community-map-card__title">${escapeHtml(record.view.title)}</p>
          <p class="community-map-card__meta">In library · ${record.downloadedAtIso.slice(0, 10)}</p>
          <div class="community-map-card__actions">
            <button class="primary-action" data-testid="maps-library-play-button" data-map-id="${mapId}" data-action="play-library" type="button" ${canPlay ? "" : "disabled"}>Play from library</button>
          </div>
        </div>
      </div>`;
  };
  syncCommunityMapsState = () => {
    root.dataset.serfboundMapsStatus = communityMapsStatus;
    root.dataset.serfboundMapsGalleryCount = String(communityGallery.length);
    root.dataset.serfboundMapsLibraryCount = String(communityLibrary.length);
    root.dataset.serfboundMapsAuth = communityMapsAuthMode();
    if (activeCommunityMapId === null) {
      delete root.dataset.serfboundCommunityMapId;
    } else {
      root.dataset.serfboundCommunityMapId = activeCommunityMapId;
    }

    if (mapsStateElement !== null) {
      mapsStateElement.textContent =
        communityMapsStatus === "loading"
          ? "Loading"
          : communityMapsStatus === "published"
            ? "Published"
            : communityMapsStatus === "downloaded"
              ? "Downloaded"
              : communityMapsStatus === "playing"
                ? "Playing community map"
                : communityMapsStatus === "rated"
                  ? "Rated"
                  : communityMapsStatus === "reported"
                    ? "Reported"
                    : communityMapsStatus === "unavailable"
                      ? "Gallery unavailable"
                      : communityGallery.length > 0
                        ? `${communityGallery.length} maps`
                        : "Ready to browse";
    }

    if (mapsDetailElement !== null) {
      mapsDetailElement.textContent = communityMapsDetail;
    }

    const publishDisabled =
      communityMapsBusy || currentEditor === undefined || !canUseSignedCommunityActions();
    if (mapsPublishButton !== null) {
      mapsPublishButton.disabled = publishDisabled;
    }
    if (editorPublishButton !== null) {
      editorPublishButton.disabled = publishDisabled;
    }
    if (mapsSigninButton !== null) {
      mapsSigninButton.disabled =
        communityMapsBusy || canUseSignedCommunityActions() || onlineSurface.status === "signing-in";
    }
    if (mapsRefreshButton !== null) {
      mapsRefreshButton.disabled = communityMapsBusy;
    }

    if (mapsGalleryElement !== null) {
      mapsGalleryElement.innerHTML =
        communityGallery.length === 0
          ? `<p class="status-panel__detail">No community maps loaded.</p>`
          : sortedCommunityGallery().map(renderCommunityCard).join("");
    }

    if (mapsLibraryElement !== null) {
      mapsLibraryElement.innerHTML =
        communityLibrary.length === 0
          ? `<p class="status-panel__detail">Local library empty.</p>`
          : `<p class="status-panel__label">Local library</p>${communityLibrary
              .map(renderCommunityLibraryCard)
              .join("")}`;
    }
  };
  const loadCommunityLibrary = async (): Promise<void> => {
    try {
      communityLibrary = await communityMapLibraryStore.list();
    } catch {
      communityLibrary = [];
    }
    syncCommunityMapsState();
  };
  const loadCommunityGallery = async (): Promise<void> => {
    communityMapsBusy = true;
    communityMapsStatus = "loading";
    communityMapsDetail = "Reading the gallery.";
    syncCommunityMapsState();
    try {
      communityGallery = await listMaps(onlineConfig.mapsUrl, communityGalleryFilter());
      communityMapsStatus = "ready";
      communityMapsDetail =
        communityGallery.length === 0
          ? "The gallery is quiet."
          : "Choose a map to download, rate, report, or play.";
    } catch {
      communityMapsStatus = "unavailable";
      communityMapsDetail = "The maps service is unreachable. Local play is unaffected.";
    } finally {
      communityMapsBusy = false;
      syncCommunityMapsState();
    }
  };
  const thumbnailDataUrlForMap = (map: SerfboundCustomMap): string | undefined => {
    try {
      const landscape = decodeCustomMapLandscape(map);
      const thumbnail = markThumbnailStarts(renderMapThumbnail(landscape, 96), landscape, map.starts);
      return mapThumbnailDataUrl(thumbnail);
    } catch {
      return undefined;
    }
  };
  const publishCurrentEditorMap = async (): Promise<void> => {
    const session = identityV2Session();
    const keys = onlineSurface.keys;
    const authorKeyId = session?.accountId ?? onlineSurface.accountId;
    if (
      currentEditor === undefined ||
      authorKeyId === undefined ||
      (session === undefined && keys === undefined)
    ) {
      communityMapsStatus = "idle";
      communityMapsDetail = "Sign in and open the map editor before publishing.";
      syncCommunityMapsState();
      return;
    }

    communityMapsBusy = true;
    communityMapsStatus = "loading";
    communityMapsDetail = "Publishing the open map.";
    syncCommunityMapsState();
    const title = mapsTitleInput?.value.trim() || "COMMUNITY MAP";
    let map = editorToCustomMap(
      currentEditor.editor,
      title,
      authorKeyId,
      session?.displayName ?? onlineSurface.accountName ?? currentProfile.name,
      new Date().toISOString(),
    );
    const thumbnail = thumbnailDataUrlForMap(map);
    if (thumbnail !== undefined) {
      map = { ...map, meta: { ...map.meta, thumbnail } };
    }

    try {
      let mapId: string;
      if (session !== undefined) {
        mapId = await publishMapWithIdentityV2(onlineConfig.mapsUrl, session, map);
      } else if (keys !== undefined) {
        mapId = await publishMap(onlineConfig.mapsUrl, keys, map);
      } else {
        return;
      }
      activeCommunityMapId = mapId;
      communityMapsStatus = "published";
      communityMapsDetail = `${map.meta.title} is in the gallery.`;
      communityGallery = await listMaps(onlineConfig.mapsUrl, communityGalleryFilter());
    } catch (error) {
      communityMapsStatus = "unavailable";
      communityMapsDetail = errorMessage(error);
    } finally {
      communityMapsBusy = false;
      syncCommunityMapsState();
    }
  };
  const saveFetchedCommunityMap = async (mapId: string): Promise<StoredCommunityMapRecord | null> => {
    communityMapsBusy = true;
    communityMapsStatus = "loading";
    communityMapsDetail = "Downloading map.";
    syncCommunityMapsState();
    try {
      const fetched = await fetchMap(onlineConfig.mapsUrl, mapId);
      const thumbnail = fetched.map.meta.thumbnail ?? thumbnailDataUrlForMap(fetched.map);
      const view: MapGalleryEntry = {
        ...fetched.view,
        thumbnail: fetched.view.thumbnail ?? thumbnail ?? null,
      };
      const map =
        thumbnail === undefined || fetched.map.meta.thumbnail !== undefined
          ? fetched.map
          : { ...fetched.map, meta: { ...fetched.map.meta, thumbnail } };
      const record = createStoredCommunityMapRecord({ mapId, map, view });
      const result = await saveCommunityMapRecord(communityMapLibraryStore, record);
      if (result.state === "error") {
        throw new Error(result.message);
      }
      activeCommunityMapId = mapId;
      communityMapsStatus = "downloaded";
      communityMapsDetail = `${view.title} is in your library.`;
      await loadCommunityLibrary();
      return record;
    } catch (error) {
      communityMapsStatus = "unavailable";
      communityMapsDetail = errorMessage(error);
      return null;
    } finally {
      communityMapsBusy = false;
      syncCommunityMapsState();
    }
  };
  const playCommunityMap = async (record: StoredCommunityMapRecord): Promise<void> => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      communityMapsDetail = "Import game data and return to the title before playing a community map.";
      syncCommunityMapsState();
      return;
    }

    activeCommunityMapId = record.mapId;
    communityMapsStatus = "playing";
    communityMapsDetail = `Playing ${record.view.title}.`;
    if (currentEditor !== undefined) {
      closeEditor();
    }
    startGameNow({ customMap: record.map });
    const session = identityV2Session();
    if (session !== undefined) {
      void reportMapPlayedWithIdentityV2(onlineConfig.mapsUrl, session, record.mapId)
        .then((played) => {
          communityGallery = communityGallery.map((entry) =>
            entry.mapId === record.mapId ? { ...entry, timesPlayed: played.timesPlayed } : entry,
          );
          syncCommunityMapsState();
        })
        .catch(() => {});
    } else if (onlineSurface.keys !== undefined) {
      void reportMapPlayed(onlineConfig.mapsUrl, onlineSurface.keys, record.mapId)
        .then((played) => {
          communityGallery = communityGallery.map((entry) =>
            entry.mapId === record.mapId ? { ...entry, timesPlayed: played.timesPlayed } : entry,
          );
          syncCommunityMapsState();
        })
        .catch(() => {});
    }
    syncCommunityMapsState();
  };
  const rateCommunityMap = async (mapId: string, stars: number): Promise<void> => {
    const session = identityV2Session();
    const keys = onlineSurface.keys;
    if (session === undefined && keys === undefined) {
      return;
    }

    communityMapsBusy = true;
    communityMapsStatus = "loading";
    communityMapsDetail = "Rating map.";
    syncCommunityMapsState();
    try {
      let rated: { rating: number; ratingCount: number };
      if (session !== undefined) {
        rated = await rateMapWithIdentityV2(onlineConfig.mapsUrl, session, mapId, stars);
      } else if (keys !== undefined) {
        rated = await rateMap(onlineConfig.mapsUrl, keys, mapId, stars);
      } else {
        return;
      }
      communityGallery = communityGallery.map((entry) =>
        entry.mapId === mapId
          ? { ...entry, rating: rated.rating, ratingCount: rated.ratingCount }
          : entry,
      );
      communityMapsStatus = "rated";
      communityMapsDetail = "Rating saved.";
    } catch (error) {
      communityMapsStatus = "unavailable";
      communityMapsDetail = errorMessage(error);
    } finally {
      communityMapsBusy = false;
      syncCommunityMapsState();
    }
  };
  const reportCommunityMap = async (mapId: string): Promise<void> => {
    const session = identityV2Session();
    const keys = onlineSurface.keys;
    if (session === undefined && keys === undefined) {
      return;
    }

    communityMapsBusy = true;
    communityMapsStatus = "loading";
    communityMapsDetail = "Reporting map.";
    syncCommunityMapsState();
    try {
      let reported: { quarantined: boolean; reports: number };
      if (session !== undefined) {
        reported = await reportMapWithIdentityV2(onlineConfig.mapsUrl, session, mapId);
      } else if (keys !== undefined) {
        reported = await reportMap(onlineConfig.mapsUrl, keys, mapId);
      } else {
        return;
      }
      if (reported.quarantined) {
        communityGallery = communityGallery.filter((entry) => entry.mapId !== mapId);
      }
      communityMapsStatus = "reported";
      communityMapsDetail = reported.quarantined
        ? "Report saved; the map is quarantined."
        : "Report saved for maintainer review.";
    } catch (error) {
      communityMapsStatus = "unavailable";
      communityMapsDetail = errorMessage(error);
    } finally {
      communityMapsBusy = false;
      syncCommunityMapsState();
    }
  };
  const syncSignInMoment = () => {
    root.dataset.serfboundSigninMethod = signInMethod;
    root.dataset.serfboundSigninStatus = signInMomentStatus;
    if (identityV2Account !== undefined) {
      root.dataset.serfboundIdentityV2AccountId = identityV2Account.accountId;
      root.dataset.serfboundIdentityV2Session =
        identityV2Account.session === undefined ? "false" : "true";
    } else {
      delete root.dataset.serfboundIdentityV2AccountId;
      delete root.dataset.serfboundIdentityV2Session;
    }

    for (const button of signInMethodButtons) {
      const active = button.dataset["signinMethod"] === signInMethod;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    for (const panel of signInPanels) {
      const panelKind = panel.dataset["signinPanel"];
      panel.hidden =
        (panelKind === "email" && signInMethod !== "email") ||
        (panelKind === "passkey" && signInMethod !== "passkey") ||
        (panelKind === "provider" && !providerSignInMethods.has(signInMethod));
    }

    if (signInProviderName !== null && providerSignInMethods.has(signInMethod)) {
      signInProviderName.textContent =
        signInMethod === "meta" ? "Meta" : signInMethod === "apple" ? "Apple" : "Google";
    }

    if (signInMomentState !== null) {
      signInMomentState.textContent = signInMomentMessage;
    }

    if (signInEmailSubmit !== null) {
      signInEmailSubmit.disabled = signInMomentStatus === "working";
    }
  };
  const selectSignInMethod = (method: SignInMethod) => {
    signInMethod = method;
    signInMomentStatus = identityV2Account === undefined ? "idle" : "ready";
    if (method === "email") {
      signInMomentMessage =
        identityV2Account === undefined
          ? "Email sign-in creates or opens a v2 account. Local play stays open."
          : `V2 account ready for ${identityV2Account.displayName}. Local play stays open.`;
    } else if (method === "passkey") {
      signInMomentMessage =
        "Passkey sign-in is ready for the browser ceremony; local play stays open.";
    } else {
      const provider = method === "meta" ? "Meta" : method === "apple" ? "Apple" : "Google";
      signInMomentMessage = `${provider} sign-in waits for provider registration. Local play stays open.`;
    }

    syncSignInMoment();
  };
  const signInWithEmailV2 = async () => {
    if (signInEmailInput === null || signInPasswordInput === null) {
      return;
    }

    const email = signInEmailInput.value.trim();
    const password = signInPasswordInput.value;
    if (email === "" || password.length < 8) {
      signInMomentStatus = "unavailable";
      signInMomentMessage = "Enter an email and at least 8 password characters.";
      syncSignInMoment();
      return;
    }

    signInMomentStatus = "working";
    signInMomentMessage = "Opening the account door.";
    syncSignInMoment();
    try {
      identityV2Account = await createPasswordIdentityV2Account(onlineConfig.identityUrl, {
        email,
        password,
        displayName: currentProfile.name,
      });
    } catch (error) {
      if (error instanceof IdentityV2ServiceError && error.reason === "credential-exists") {
        try {
          identityV2Account = await signInPasswordIdentityV2(onlineConfig.identityUrl, {
            email,
            password,
          });
        } catch (signInError) {
          signInMomentStatus = "unavailable";
          signInMomentMessage =
            signInError instanceof IdentityV2ServiceError
              ? signInError.message
              : "Sign-in failed. Local play stays open.";
          syncSignInMoment();
          return;
        }
      } else {
        signInMomentStatus = "unavailable";
        signInMomentMessage =
          error instanceof IdentityV2ServiceError
            ? error.message
            : "Sign-in failed. Local play stays open.";
        syncSignInMoment();
        return;
      }
    }

    signInMomentStatus = "ready";
    signInMomentMessage = `V2 account ready for ${identityV2Account.displayName}. Local play stays open.`;
    if (identityV2Account.session !== undefined) {
      onlineSurface.useIdentityV2Session(identityV2Account.session);
    }

    syncSignInMoment();
    syncCommunityMapsState();
    syncOnlineState();
  };
  void loadCommunityLibrary();
  let lastYourTurnCount = 0;
  const syncOnlineState = () => {
    root.dataset.serfboundOnlineStatus = onlineSurface.status;
    root.dataset.serfboundOnlineAuth = onlineSurface.authMode;
    root.dataset.serfboundOnlineYourTurn = String(onlineSurface.yourTurnCount);
    root.dataset.serfboundOnlineLobbyCount = String(onlineSurface.lobby.length);
    if (onlineStateElement !== null) {
      onlineStateElement.textContent =
        onlineSurface.status === "signed-in"
          ? `Signed in as ${onlineSurface.accountName ?? ""}`
          : onlineSurface.status === "signing-in"
            ? "Signing in"
            : onlineSurface.status === "unavailable"
              ? "Online unavailable"
              : "Signed out";
    }

    if (onlineDetailElement !== null) {
      onlineDetailElement.textContent =
        onlineSurface.status === "unavailable"
          ? "The online service is unreachable. Local play is unaffected; use Refresh online to retry."
          : "Optional: play correspondence matches over the internet. Local play never needs this.";
    }

    if (onlineSignInButton !== null) {
      onlineSignInButton.disabled =
        onlineSurface.identityV2Session !== undefined ||
        onlineSurface.status === "signed-in" ||
        onlineSurface.status === "signing-in";
    }

    if (onlineChallengeButton !== null) {
      onlineChallengeButton.disabled = onlineSurface.status !== "signed-in";
    }

    if (onlineBadgeElement !== null) {
      const count = onlineSurface.yourTurnCount;
      onlineBadgeElement.hidden = count === 0;
      onlineBadgeElement.textContent = `Your turn in ${count} ${count === 1 ? "match" : "matches"}`;
      // The badge may pulse once when a turn arrives (standard §3) —
      // and never under reduced motion (tokens collapse durations).
      if (count > lastYourTurnCount) {
        onlineBadgeElement.classList.remove("is-fresh");
        void onlineBadgeElement.offsetWidth;
        onlineBadgeElement.classList.add("is-fresh");
      }

      lastYourTurnCount = count;
    }

    if (onlineLobbyElement !== null) {
      const canAccept =
        onlineSurface.status === "signed-in" &&
        currentImportedDataSource !== undefined &&
        currentWorld === undefined;
      if (onlineSurface.lobby.length === 0) {
        // The empty lobby is a designed state, not an absence.
        onlineLobbyElement.innerHTML =
          onlineSurface.status === "signed-in"
            ? `<p class="lobby-empty">The lobby is quiet. Post a challenge and let the realm know.</p>`
            : "";
      } else {
        onlineLobbyElement.innerHTML = onlineSurface.lobby
          .map((entry) => {
            // Ghost guard (SB-30-04 finding): a nameless challenge is
            // never offered for pairing — it renders unclaimable.
            if (!entry.challengerName) {
              return `
            <div class="lobby-card lobby-card--ghost">
              <p class="lobby-card__name">A HERALD WITH NO NAME</p>
              <p class="lobby-card__terms">Unclaimable — the scribes have been told.</p>
            </div>`;
            }

            const rating = onlineSurface.ratingForKeyId(entry.challengerKeyId);
            return `
            <div class="lobby-card" data-challenger-key-id="${entry.challengerKeyId}">
              <p class="lobby-card__name">${entry.challengerName}${
                rating === undefined ? "" : ` <span class="lobby-card__rating">${rating}</span>`
              }</p>
              <p class="lobby-card__terms">Map size ${entry.terms.mapSize} · ${entry.terms.windowTicks}-tick windows</p>
              <button
                class="secondary-action"
                data-testid="online-accept-button"
                data-challenge-id="${entry.challengeId}"
                type="button"
                ${canAccept ? "" : "disabled"}
              >Accept challenge from ${entry.challengerName}</button>
            </div>`;
          })
          .join("");
      }
    }

    syncLadderState();
    syncCommunityMapsState();
  };
  // The ladder (SB-30-01): the Phase 25 Elo table, finally visible.
  // Loads on explicit request; your row carries the gold accent;
  // disputes are counted out loud.
  const ladderRowsElement = root.querySelector<HTMLElement>("[data-testid='online-ladder-rows']");
  const ladderNoteElement = root.querySelector<HTMLElement>("[data-testid='online-ladder-note']");
  const syncLadderState = () => {
    if (ladderRowsElement === null) {
      return;
    }

    root.dataset.serfboundLadderCount = String(onlineSurface.ladder.length);
    if (onlineSurface.ladder.length === 0) {
      ladderRowsElement.innerHTML = `<p class="ladder__empty">No rated matches yet — the first dual-attested result starts the ledger.</p>`;
    } else {
      ladderRowsElement.innerHTML = onlineSurface.ladder
        .map((entry, index) => {
          const own = entry.keyId === onlineSurface.accountId;
          return `
            <div class="ladder__row${own ? " ladder__row--own" : ""}">
              <span class="ladder__rank">${index + 1}</span>
              <span class="ladder__name">${entry.name}${own ? " (you)" : ""}</span>
              <span class="ladder__rating">${entry.rating}</span>
              <span class="ladder__matches">${entry.matches} ${entry.matches === 1 ? "match" : "matches"}</span>
            </div>`;
        })
        .join("");
    }

    if (ladderNoteElement !== null) {
      const disputed = onlineSurface.disputedCount;
      ladderNoteElement.hidden = disputed === 0;
      ladderNoteElement.textContent =
        disputed === 0
          ? ""
          : `${disputed} of your ${disputed === 1 ? "match is" : "matches are"} disputed — quarantined, unrated.`;
    }

    // The chronicle shows the rating once the ladder has been read —
    // never fetched on the profile's account (SB-30-02).
    const chronicleRating = root.querySelector<HTMLElement>("[data-testid='chronicle-rating']");
    if (chronicleRating !== null) {
      const own = onlineSurface.ladder.find((entry) => entry.keyId === onlineSurface.accountId);
      chronicleRating.hidden = own === undefined;
      chronicleRating.textContent = own === undefined ? "" : `Rated ${own.rating} on the ladder.`;
    }
  };
  root
    .querySelector<HTMLDetailsElement>("[data-testid='online-ladder']")
    ?.addEventListener("toggle", (event) => {
      if ((event.target as HTMLDetailsElement).open) {
        void onlineSurface.loadLadder().then(syncOnlineState);
      }
    });
  const syncOnlineMatchState = () => {
    if (currentOnline === undefined) {
      return;
    }

    const status = currentOnline.status;
    root.dataset.serfboundCorMode = status.mode;
    root.dataset.serfboundCorWindow = String(status.window);
    root.dataset.serfboundCorPlayer = String(status.localPlayer);
    root.dataset.serfboundCorChecksum = String(status.checksum >>> 0);
    root.dataset.serfboundOnlineMatchId = status.matchId;
    if (status.boundaryChecksum !== null) {
      root.dataset.serfboundCorBoundary = String(status.boundaryChecksum >>> 0);
    }

    if (status.digest !== null) {
      root.dataset.serfboundCorDigest = digestLines(status.digest).join(" / ");
    }

    if (status.failureReason !== null) {
      root.dataset.serfboundCorFailure = status.failureReason;
    }

    if (status.opponentName !== null) {
      root.dataset.serfboundCorOpponent = status.opponentName;
    }

    const canAttest =
      status.serviceState === "active" &&
      status.boundaryChecksum !== null &&
      (status.mode === "your-window" ||
        status.mode === "awaiting-move" ||
        status.mode === "move-arrived");
    if (onlineAttestWinButton !== null) {
      onlineAttestWinButton.hidden = !canAttest;
    }

    if (onlineAttestLossButton !== null) {
      onlineAttestLossButton.hidden = !canAttest;
    }

    if (onlineSealLabel !== null) {
      onlineSealLabel.hidden = !canAttest;
    }

    // The match strip: the whole correspondence at a glance, in the
    // product's voice — and the closing ceremony when it ends.
    if (onlineMatchStrip !== null && onlineMatchLine !== null) {
      onlineMatchStrip.hidden = false;
      const opponent = status.opponentName ?? "your opponent";
      onlineMatchLine.textContent =
        status.mode === "ended"
          ? status.serviceState === "disputed"
            ? "Disputed — quarantined, unrated"
            : status.serviceState === "forfeited"
              ? status.winnerSeat === status.localPlayer
                ? `${opponent} forfeited — victory, rated`
                : "Forfeited — defeat, rated"
              : status.winnerSeat === status.localPlayer
                ? "Victory — sealed and rated"
                : "Defeat — sealed and rated"
          : status.mode === "your-window"
            ? `Your window, against ${opponent}`
            : status.mode === "move-arrived"
              ? `${opponent} moved — press Enter to watch`
              : status.mode === "recap"
                ? `Verifying ${opponent}'s window`
                : status.mode === "failed"
                  ? "The match failed verification"
                  : `Waiting on ${opponent}`;
    }
  };
  const startOnlineMatch = (view: MailboxMatchView, seat: number) => {
    const keys = onlineSurface.keys;
    const identityV2Session = onlineSurface.identityV2Session;
    const auth =
      identityV2Session !== undefined
        ? { identityV2Session }
        : keys !== undefined
          ? { keys }
          : undefined;
    if (
      currentImportedDataSource === undefined ||
      currentWorld !== undefined ||
      auth === undefined
    ) {
      return;
    }

    currentOnline = new SerfboundOnlineMatch({
      view,
      seat,
      ...auth,
      mailboxUrl: onlineConfig.mailboxUrl,
      data: currentImportedDataSource,
      onEnded: (endedView) => {
        const result =
          endedView.state === "disputed"
            ? "completed"
            : endedView.state === "forfeited"
              ? endedView.forfeitedPlayer === seat
                ? "lost"
                : "won"
              : endedView.winnerSeat === seat
                ? "won"
                : "lost";
        recordMatchEnd("online", currentOnline?.status.opponentName ?? null, seat, result);
        root.dataset.serfboundOnlineMatchOutcome = `${endedView.state}:${result}`;
        setNotice(uiText("notice.gameOver"));
        syncOnlineMatchState();
        void onlineSurface.refresh().then(syncOnlineState);
      },
    });
    currentBuiltStructures = [];
    const match = currentOnline.match;
    startLandscapeRendering({ landscape: () => match.world });
    commandRouter = new SerfboundCommandRouter(match.state, match.world);
    commandRouter.localPlayer = seat;
    commandRouter.onWorldAction = (action) => currentOnline?.queue(action);
    currentWorld = match.world;
    currentSerfEngine = match.serfEngine;
    currentLocalPlayer = seat;
    root.dataset.serfboundGameState = "running";
    getGameStateElement(root).textContent = "Running";
    syncOnlineMatchState();
    syncWorldState(root, currentWorld);
    renderCurrentScene();
  };
  const signInOnline = (options: { readonly refreshMailbox?: boolean } = {}) => {
    if (onlineSurface.status === "signed-in" || onlineSurface.identityV2Session !== undefined) {
      if (options.refreshMailbox !== false) {
        void onlineSurface.refresh().then(syncOnlineState);
      }

      syncOnlineState();
      return;
    }

    void onlineSurface.signIn(currentProfile.name).then(async (ok) => {
      if (ok && options.refreshMailbox !== false) {
        await onlineSurface.refresh();
      }

      syncOnlineState();
    });
    syncOnlineState();
  };
  for (const button of signInMethodButtons) {
    button.addEventListener("click", () => {
      const method = button.dataset["signinMethod"];
      if (
        method === "email" ||
        method === "passkey" ||
        method === "google" ||
        method === "apple" ||
        method === "meta"
      ) {
        selectSignInMethod(method);
      }
    });
  }

  signInEmailSubmit?.addEventListener("click", () => {
    void signInWithEmailV2();
  });
  for (const input of [signInEmailInput, signInPasswordInput]) {
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        void signInWithEmailV2();
      }
    });
  }

  root
    .querySelector<HTMLButtonElement>("[data-testid='signin-passkey-button']")
    ?.addEventListener("click", () => {
      signInMomentStatus = identityV2Account === undefined ? "idle" : "ready";
      signInMomentMessage =
        "Passkey ceremonies come next; this screen already keeps accountless play open.";
      syncSignInMoment();
    });
  syncSignInMoment();
  onlineSignInButton?.addEventListener("click", () => signInOnline());
  root
    .querySelector<HTMLButtonElement>("[data-testid='online-refresh-button']")
    ?.addEventListener("click", () => {
      void onlineSurface.refresh().then(syncOnlineState);
    });
  onlineChallengeButton?.addEventListener("click", () => {
    void onlineSurface
      .postChallenge({
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
        windowTicks: hotseatWindowTicks,
        pickupSeconds: 3600,
      })
      .then(syncOnlineState);
  });
  onlineLobbyElement?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-testid='online-accept-button']",
    );
    const challengeId = button?.dataset["challengeId"];
    if (button === null || button === undefined || challengeId === undefined) {
      return;
    }

    void onlineSurface.accept(challengeId).then((view) => {
      syncOnlineState();
      if (view !== null) {
        const seat = view.yourSeat ?? 1;
        startOnlineMatch(view, seat);
      }
    });
  });
  onlineAttestWinButton?.addEventListener("click", () => {
    void currentOnline?.attest(currentOnline.localPlayer).then(syncOnlineMatchState);
  });
  onlineAttestLossButton?.addEventListener("click", () => {
    void currentOnline?.attest(1 - currentOnline.localPlayer).then(syncOnlineMatchState);
  });
  mapsSigninButton?.addEventListener("click", () => signInOnline({ refreshMailbox: false }));
  mapsRefreshButton?.addEventListener("click", () => {
    void loadCommunityGallery();
  });
  mapsPublishButton?.addEventListener("click", () => {
    void publishCurrentEditorMap();
  });
  editorPublishButton?.addEventListener("click", () => {
    void publishCurrentEditorMap();
  });
  mapsFilterPlayers?.addEventListener("change", () => {
    void loadCommunityGallery();
  });
  mapsSort?.addEventListener("change", syncCommunityMapsState);
  mapsGalleryElement?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]");
    const mapId = button?.dataset["mapId"];
    const action = button?.dataset["action"];
    if (button === null || button === undefined || mapId === undefined || action === undefined) {
      return;
    }

    if (action === "download") {
      void saveFetchedCommunityMap(mapId);
    } else if (action === "play-gallery") {
      void saveFetchedCommunityMap(mapId).then((record) => {
        if (record !== null) {
          void playCommunityMap(record);
        }
      });
    } else if (action === "rate") {
      void rateCommunityMap(mapId, Number(button.dataset["stars"] ?? "5"));
    } else if (action === "report") {
      void reportCommunityMap(mapId);
    }
  });
  mapsLibraryElement?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action='play-library']",
    );
    const mapId = button?.dataset["mapId"];
    if (button === null || button === undefined || mapId === undefined) {
      return;
    }

    const record = communityLibrary.find((entry) => entry.mapId === mapId);
    if (record !== undefined) {
      void playCommunityMap(record);
    }
  });
  // The slow online timer: poll the active match's mailbox view, and —
  // for a signed-in player — keep the lobby and your-turn badge fresh.
  // A challenger whose challenge got accepted starts the match from
  // here. Signed-out players generate zero network traffic.
  let onlinePollCounter = 0;
  setInterval(() => {
    if (currentOnline !== undefined) {
      void currentOnline.poll().then(syncOnlineMatchState);
    }

    if (onlineSurface.status !== "signed-in" && onlineSurface.status !== "unavailable") {
      return;
    }

    onlinePollCounter += 1;
    if (onlinePollCounter % 3 !== 0) {
      return;
    }

    void onlineSurface.refresh().then((ok) => {
      syncOnlineState();
      if (!ok || currentOnline !== undefined || currentWorld !== undefined) {
        return;
      }

      // Challenge accepted while we waited: a fresh active match where
      // this player is the challenger (seat 0) with no moves yet.
      const fresh = onlineSurface.activeMatches.find(
        (match) => match.yourSeat === 0 && match.moves.length === 0,
      );
      if (fresh !== undefined) {
        startOnlineMatch(fresh, 0);
      }
    });
  }, 2000);
  // Deeds evaluator (SB-30-03): a slow pure check over facts the app
  // already tracks. Never blocks play, never networks; unlocks write
  // the profile and speak once through the original notice path.
  setInterval(() => {
    const stats = deriveProfileStatistics(currentProfile.history);
    const facts: AchievementFacts = {
      dataImported: currentImportedDataSource !== undefined,
      hasCastle: root.dataset.serfboundWorldHasCastle === "true",
      buildingsDone: Number(root.dataset.serfboundWorldBuildingDoneCount ?? "0"),
      savedOnce:
        root.querySelector<HTMLButtonElement>("[data-testid='clear-save-button']")?.disabled ===
        false,
      played: stats.played,
      won: stats.won,
      bestStreak: stats.bestStreak,
      onlinePlayed: currentProfile.history.filter((entry) => entry.mode === "online").length,
      onlineWon: currentProfile.history.filter(
        (entry) => entry.mode === "online" && entry.result === "won",
      ).length,
      missionsWon: currentProfile.missionsCompleted?.length ?? 0,
    };
    const satisfied = evaluateAchievements(facts);
    const unlockedIds = new Set((currentProfile.achievements ?? []).map((entry) => entry.id));
    const fresh = satisfied.filter((id) => !unlockedIds.has(id));
    if (fresh.length === 0) {
      return;
    }

    let next = currentProfile;
    const now = new Date().toISOString();
    for (const id of fresh) {
      next = withAchievement(next, id, now);
    }

    saveProfile(next);
    const [firstId] = fresh;
    const first = firstId === undefined ? undefined : achievementById(firstId);
    if (first !== undefined) {
      setNotice(uiText("notice.achievement", { name: first.name }));
    }
  }, 4000);

  // A previously linked account signs back in silently — the keypair
  // is the account (SB-25-02); restoring it is the player's standing
  // opt-in to online traffic.
  void profileStore.load().then((stored) => {
    if (stored?.account !== undefined) {
      onlineSurface.restore(stored.account, stored.name);
      void onlineSurface.refresh().then(syncOnlineState);
    }

    syncOnlineState();
  });
  startButton.addEventListener("click", () => {
    // With the init screen up (decoded mode), the shell button is the
    // accessible path to the same custom game; the catalog-only fallback
    // keeps its deterministic derived seed.
    if (initScreenSettings() !== undefined) {
      startGameNow({ seedString: initSeedString, initialSupplies: initSupplies });
    } else {
      startGameNow({});
    }
  });


  const buildRoadButton = root.querySelector<HTMLButtonElement>("[data-testid='build-road-button']");
  if (buildRoadButton === null) {
    throw new Error("Serfbound shell build road button did not mount.");
  }

  buildRoadButton.addEventListener("click", () => {
    if (root.dataset.serfboundRoadMode !== "idle") {
      setRoadMode("idle");
  setGameSpeed(1);
      getCommandStateElement(root).textContent = "Road mode ended";
      getCommandDetailElement(root).textContent = "Select a tile to inspect available actions.";
      return;
    }

    setRoadMode("awaiting-start");
    getCommandStateElement(root).textContent = "Build road";
    getCommandDetailElement(root).textContent = "Select the starting flag.";
  });

  const buildLumberjackButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='build-lumberjack-button']",
  );
  if (buildLumberjackButton === null) {
    throw new Error("Serfbound shell build lumberjack button did not mount.");
  }

  buildLumberjackButton.addEventListener("click", () => {
    const interaction = selectedInteraction;
    if (interaction === undefined || currentWorld === undefined) {
      return;
    }

    const result = commandRouter.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: interaction.tile,
      buildingKind: "lumberjack",
    });
    if (result.status === "accepted" && currentSerfEngine !== undefined) {
      // Send out the builder and the construction materials.
      const newest = [...currentWorld!.buildings.values()].reduce((a, b) =>
        a.index > b.index ? a : b,
      );
      currentSerfEngine.dispatchConstructionLogistics(newest, commandRouter.state.tick);
    }

    currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    applyCommandResultState(root, result);
    syncWorldState(root, currentWorld);
    renderCurrentScene();
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  });

  const buildFlagButton = root.querySelector<HTMLButtonElement>("[data-testid='build-flag-button']");
  if (buildFlagButton === null) {
    throw new Error("Serfbound shell build flag button did not mount.");
  }

  buildFlagButton.addEventListener("click", () => {
    const interaction = selectedInteraction;
    if (interaction === undefined) {
      return;
    }

    if (currentWorld !== undefined) {
      const worldResult = commandRouter.dispatch({
        type: "game.build-flag",
        source: "pointer",
        tile: interaction.tile,
      });
      currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
      applyCommandResultState(root, worldResult);
      syncWorldState(root, currentWorld);
      renderCurrentScene();
      syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
      return;
    }

    const result = commandRouter.dispatch({
      type: "game.build",
      source: "pointer",
      building: "flag",
      tile: interaction.tile,
    });
    currentBuiltStructures = result.snapshot.builtStructures;
    currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    applyCommandResultState(root, result);
    renderCurrentScene();
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  });

  const saveButton = getSaveGameButton(root);
  saveButton.addEventListener("click", () => {
    const snapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    if (snapshot === undefined) {
      return;
    }

    currentLocalGameSnapshot = snapshot;
    void saveCurrentLocalGame(
      root,
      localGameSaveStore,
      snapshot,
      (record) => {
        currentSavedLocalGame = record;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  // Wire a freshly restored local game into every live surface (renderer,
  // command router, world, AI, save controls). Shared by the Load button and
  // the rig loader (SB-44-03) so both paths restore identically. The
  // landscape-asset guards keep a restore safe before SPAU.PA is imported.
  const applyRestoredLocalGame = (
    restored: SerfboundLocalGameStarted,
    options: { readonly savedRecord?: StoredLocalGameSaveRecord } = {},
  ): void => {
    currentLocalGameSnapshot = restored.snapshot;
    currentBuiltStructures = restored.snapshot.state.builtStructures;
    selectedInteraction = undefined;
    startLandscapeRendering(restored.game);
    commandRouter = new SerfboundCommandRouter(
      restored.game.state,
      currentLandscapeAssets === undefined ? undefined : restored.game.world(),
    );
    currentWorld = currentLandscapeAssets === undefined ? undefined : restored.game.world();
    currentSerfEngine =
      currentLandscapeAssets === undefined ? undefined : restored.game.serfEngine();
    attachAiPlayers(restored.game);
    applyRunningLocalGameSnapshot(root, restored.snapshot);
    syncWorldState(root, currentWorld);
    // Open on the action: center on the local player's castle (or any building
    // if there's no castle yet), so a rigged/loaded world doesn't strand the
    // camera at the map origin. New games (no buildings) stay at the origin.
    if (currentWorld !== undefined) {
      const focusPosition = (() => {
        const player = currentWorld.players[currentLocalPlayer];
        if (player !== undefined && player.castlePosition !== null) {
          return player.castlePosition;
        }
        for (const building of currentWorld.buildings.values()) {
          return building.position;
        }
        return null;
      })();
      if (focusPosition !== null) {
        centerScrollOnPosition(focusPosition);
      }
    }
    renderCurrentScene();
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    if (options.savedRecord !== undefined) {
      currentSavedLocalGame = options.savedRecord;
      applyLocalGameLoadedState(root, options.savedRecord);
    }
    syncLocalGameSaveControls(
      root,
      currentLocalGameSnapshot,
      currentSavedLocalGame,
      currentImportedDataSource,
    );
  };

  const loadButton = getLoadGameButton(root);
  loadButton.addEventListener("click", () => {
    void loadCurrentLocalGame(
      root,
      localGameSaveStore,
      currentImportedDataSource,
      (record, snapshot) => {
        const restored = restoreSerfboundLocalGame(snapshot);
        if (restored.status === "rejected") {
          applyLocalGameSaveErrorState(root, restored.message);
          return;
        }

        applyRestoredLocalGame(restored, { savedRecord: record });
      },
      (record) => {
        currentSavedLocalGame = record;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  const clearSaveButton = getClearSaveButton(root);
  clearSaveButton.addEventListener("click", () => {
    void clearCurrentLocalGameSave(
      root,
      localGameSaveStore,
      () => {
        currentSavedLocalGame = undefined;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  // Scenario rigging (SB-44-03): `?rig=<id>` boots straight into a pre-built
  // gate-verification state and overlays the in-game capture HUD. A dev-only
  // seam (like `?dev=1`): inert without the param, and every failure path
  // (missing fixture, malformed snapshot, no imported catalog) degrades
  // silently to the normal title screen. It runs AFTER the persisted archive
  // restore so a local game can render against the device's imported SPAU.PA.
  const rigId = (() => {
    try {
      const value = new URLSearchParams(globalThis.location?.search ?? "").get("rig");
      return value !== null && /^[a-z0-9-]+$/.test(value) ? value : undefined;
    } catch {
      return undefined;
    }
  })();

  const loadRig = async (id: string): Promise<void> => {
    let fixture: RigFixture;
    let sequence: RigSequenceEntry[] = [];
    try {
      const [fixtureResponse, manifestResponse] = await Promise.all([
        fetch(`./rigs/${id}.json`, { cache: "no-store" }),
        fetch(`./rigs/manifest.json`, { cache: "no-store" }),
      ]);
      if (!fixtureResponse.ok) {
        return;
      }
      fixture = (await fixtureResponse.json()) as RigFixture;
      if (manifestResponse.ok) {
        const manifest = (await manifestResponse.json()) as { rigs?: RigSequenceEntry[] };
        sequence = (manifest.rigs ?? []).map((entry) => ({
          id: entry.id,
          title: entry.title,
          ...(entry.gate === undefined ? {} : { gate: entry.gate }),
          ...(entry.covers === undefined ? {} : { covers: entry.covers }),
        }));
      }
    } catch {
      return;
    }

    if (fixture.rigKind === "local-game" && fixture.snapshot !== undefined) {
      // Only restore when the catalog is imported, else the world can't render;
      // the HUD still mounts so the maintainer sees what the rig needs.
      if (currentDecodedAssets !== undefined) {
        const restored = restoreSerfboundLocalGame(fixture.snapshot);
        if (restored.status === "started") {
          applyRestoredLocalGame(restored);
        }
      }
    } else if (fixture.rigKind === "editor-draft") {
      root.querySelector<HTMLButtonElement>("[data-testid='open-editor-button']")?.click();
    }
    // gallery rigs are service-driven: the HUD guides publish/browse/rate/play.

    // When the rig runs embedded in the protocol deck (the split-screen
    // iframe), the deck is the single source of truth — it shows the check and
    // captures the verdict — so an in-game HUD would only duplicate it. Mount
    // the HUD only when a rig is opened standalone (a direct ?rig= with no deck
    // driving it).
    const embedded = (() => {
      try {
        return globalThis.self !== globalThis.top;
      } catch {
        return true;
      }
    })();
    if (embedded) {
      // Rig/debug chrome: open the under-the-hood ledger (the debug tools —
      // build controls + the state readout) and flag the shell so the
      // player-facing panels declutter. We're rigging, not onboarding.
      root.dataset.serfboundRig = "1";
      root.dataset.serfboundDev = "1";
      root.querySelector<HTMLDetailsElement>("[data-testid='dev-ledger']")?.setAttribute("open", "");

      // Fast-forward controls: a rig staffs roads / grows trees / fights over
      // many ticks — let the maintainer run the clock 2×..20× (or pause) so
      // the behaviour shows in seconds, not minutes.
      const speedBar = document.createElement("div");
      speedBar.className = "rig-speed";
      speedBar.dataset.testid = "rig-speed";
      const speedLabel = document.createElement("span");
      speedLabel.className = "rig-speed__label";
      speedLabel.textContent = "Speed";
      speedBar.append(speedLabel);
      const speedButtons: HTMLButtonElement[] = [];
      for (const mult of [0, 1, 2, 4, 8, 20]) {
        const speedButton = document.createElement("button");
        speedButton.type = "button";
        speedButton.textContent = mult === 0 ? "⏸" : `${mult}×`;
        speedButton.classList.toggle("is-active", mult === 1);
        speedButton.addEventListener("click", () => {
          setGameSpeed(mult);
          for (const other of speedButtons) {
            other.classList.toggle("is-active", other === speedButton);
          }
        });
        speedButtons.push(speedButton);
        speedBar.append(speedButton);
      }
      root.append(speedBar);
    }
    if (!embedded) {
      mountRigHud({
        root,
        rig: {
          id: fixture.id,
          gate: fixture.gate,
          title: fixture.title,
          instruction: fixture.instruction,
          result: fixture.result,
          covers: fixture.covers ?? [fixture.check],
        },
        sequence,
      });
    }
  };

  void (async () => {
    await restorePersistedArchive(
      root,
      importedArchiveStore,
      renderCatalogScene,
      renderGeneratedScene,
    );
    if (currentImportedDataSource === undefined) {
      await loadConfiguredLicensedAssetPackage();
    }
    currentSavedLocalGame = await restorePersistedLocalGameSave(root, localGameSaveStore);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    if (rigId !== undefined) {
      await loadRig(rigId);
    }
  })();
}

async function restorePersistedLocalGameSave(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
): Promise<StoredLocalGameSaveRecord | undefined> {
  root.dataset.serfboundLocalSaveState = "loading";

  try {
    const record = await localGameSaveStore.loadCurrent();
    if (record === null) {
      applyNoLocalGameSaveState(root, "No saved game", "Start a game to save.");
      return undefined;
    }

    applyLocalGameSaveAvailableState(root, record);
    return record;
  } catch (error) {
    applyLocalGameSaveErrorState(
      root,
      error instanceof InvalidStoredLocalGameSaveRecordError
        ? "Saved game is corrupt or from an unsupported version. Clear the save to keep using imported data."
        : `Saved game restore failed: ${errorMessage(error)}`,
    );
    return undefined;
  }
}

async function saveCurrentLocalGame(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  snapshot: SerfboundLocalGameSnapshot,
  onSaved: (record: StoredLocalGameSaveRecord) => void,
): Promise<void> {
  root.dataset.serfboundLocalSaveState = "saving";
  getSaveStateElement(root).textContent = "Saving game";
  getSaveDetailElement(root).textContent = "Writing the current browser game state.";

  const record = createStoredLocalGameSaveRecord({ snapshot });
  const result = await saveLocalGameSaveRecord(localGameSaveStore, record);
  if (result.state === "error") {
    applyLocalGameSaveErrorState(root, `Could not save game: ${result.message}`);
    return;
  }

  onSaved(record);
  root.dataset.serfboundLocalSaveState = "persisted";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Game saved";
  getSaveDetailElement(root).textContent =
    `Saved ${record.snapshot.state.builtStructures.length} built structures.`;
}

async function loadCurrentLocalGame(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  currentImportedDataSource: SerfboundLocalGameDataSource | undefined,
  onLoaded: (
    record: StoredLocalGameSaveRecord,
    snapshot: SerfboundLocalGameSnapshot,
  ) => void,
  onAvailable: (record: StoredLocalGameSaveRecord | undefined) => void,
): Promise<void> {
  root.dataset.serfboundLocalSaveState = "loading";
  getSaveStateElement(root).textContent = "Loading game";
  getSaveDetailElement(root).textContent = "Reading the current browser save.";

  let record: StoredLocalGameSaveRecord | null;
  try {
    record = await localGameSaveStore.loadCurrent();
  } catch (error) {
    applyLocalGameSaveErrorState(
      root,
      error instanceof InvalidStoredLocalGameSaveRecordError
        ? "Saved game is corrupt or from an unsupported version. Clear the save to keep using imported data."
        : `Could not load saved game: ${errorMessage(error)}`,
    );
    return;
  }

  if (record === null) {
    onAvailable(undefined);
    applyNoLocalGameSaveState(root, "No saved game", "Start a game to save.");
    return;
  }

  onAvailable(record);
  if (currentImportedDataSource === undefined) {
    applyLocalGameSaveErrorState(root, "Load game data before loading a saved game.");
    return;
  }

  if (!localGameDataSourcesMatch(currentImportedDataSource, record.dataSource)) {
    applyLocalGameSaveErrorState(root, "Saved game uses another game data source.");
    return;
  }

  onLoaded(record, record.snapshot);
}

async function clearCurrentLocalGameSave(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  onCleared: () => void,
): Promise<void> {
  const result = await clearLocalGameSaveRecord(localGameSaveStore);
  if (result.state === "error") {
    applyLocalGameSaveErrorState(root, `Could not clear saved game: ${result.message}`);
    return;
  }

  delete root.dataset.serfboundLocalSaveSavedAt;
  delete root.dataset.serfboundLocalSaveSource;
  applyNoLocalGameSaveState(root, "No saved game", "Saved game cleared.");
  if (root.dataset.serfboundStorageState !== "error") {
    root.dataset.serfboundRecoverableState = "none";
  }
  onCleared();
}

function refreshLocalGameSnapshot(
  snapshot: SerfboundLocalGameSnapshot | undefined,
  commandRouter: SerfboundCommandRouter,
): SerfboundLocalGameSnapshot | undefined {
  if (snapshot === undefined) {
    return undefined;
  }

  return {
    ...snapshot,
    data: { ...snapshot.data },
    settings: { ...snapshot.settings },
    state: commandRouter.state.snapshot(),
    renderer: { ...snapshot.renderer },
  };
}

function applyArchiveValidation(
  root: HTMLElement,
  result: ArchiveValidationResult,
  renderGeneratedScene: SceneRenderGenerated,
): void {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundDataState = result.state;

  switch (result.state) {
    case "supported":
      state.textContent = "Game data selected";
      detail.textContent = `${result.normalizedName} is ready to load.`;
      root.dataset.serfboundCatalogState = "ready";
      root.dataset.serfboundRecoverableState = "none";
      root.dataset.serfboundActiveDataSource = "imported-dos-pa";
      setSourceState(root, "Imported data");
      syncGameReadiness(root);
      break;
    case "unsupported":
      state.textContent = "File not usable";
      detail.textContent = `${result.fileName} cannot be used. Choose SPAU.PA to start.`;
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "file-error";
      root.dataset.serfboundActiveDataSource = "none";
      renderGeneratedScene();
      setSourceState(root, "No data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      break;
    case "missing":
      state.textContent = "No game data";
      detail.textContent = "Import SPAU.PA to start a local game.";
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "none";
      root.dataset.serfboundActiveDataSource = "none";
      renderGeneratedScene();
      setSourceState(root, "No data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      break;
  }
}

async function importSelectedArchive(
  root: HTMLElement,
  file: File,
  validation: Extract<ArchiveValidationResult, { readonly state: "supported" }>,
  importedArchiveStore: ImportedArchiveStore,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundCatalogState = "parsing";
  detail.textContent = "Loading selected game data.";

  try {
    const bytes = await file.arrayBuffer();
    const catalog = parseDosPaCatalog(bytes);
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, validation.normalizedName, bytes);
    const record = createStoredImportedArchiveRecord({
      fileName: validation.fileName,
      normalizedName: validation.normalizedName,
      bytes,
    });
    const storageResult = await saveImportedArchiveRecord(importedArchiveStore, record);

    if (storageResult.state === "error") {
      root.dataset.serfboundStorageState = "error";
      root.dataset.serfboundCatalogState = "parsed";
      root.dataset.serfboundDataState = "supported";
      root.dataset.serfboundRecoverableState = "storage-error";
      root.dataset.serfboundActiveDataSource = "imported-dos-pa";
      state.textContent = "Data loaded";
      detail.textContent = "The data works for this session, but could not be saved for next time.";
      root.dataset.serfboundStorageMessage = storageResult.message;
      setSourceState(root, "Imported data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      return;
    }

    applyParsedCatalogState(root, catalog, "persisted");
  } catch (error) {
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "empty";
    root.dataset.serfboundRecoverableState = "parse-error";
    renderGeneratedScene();
    state.textContent = "Data could not be read";
    detail.textContent = "Choose SPAU.PA again to start.";
    root.dataset.serfboundDataError = errorMessage(error);
    setSourceState(root, "No data");
    syncGameReadiness(root);
    setResetEnabled(root, false);
  }
}

async function restorePersistedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  root.dataset.serfboundStorageState = "loading";

  try {
    const record = await importedArchiveStore.loadCurrent();
    if (record === null) {
      root.dataset.serfboundStorageState = "empty";
      return;
    }

    applyStoredArchiveRecord(root, record, renderCatalogScene, renderGeneratedScene);
  } catch (error) {
    if (error instanceof InvalidStoredImportedArchiveRecordError) {
      applyStorageErrorState(
        root,
        "Saved data is corrupt or from an unsupported version. Clear it and import SPAU.PA again.",
        true,
      );
      return;
    }

    applyStorageErrorState(root, `Local data restore failed: ${errorMessage(error)}`, false);
  }
}

function applyStoredArchiveRecord(
  root: HTMLElement,
  record: StoredImportedArchiveRecord,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): void {
  try {
    const catalog = parseDosPaCatalog(record.bytes);
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, record.normalizedName, record.bytes);
    applyParsedCatalogState(root, catalog, "restored", record);
  } catch (error) {
    root.dataset.serfboundDataState = "unsupported";
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "error";
    root.dataset.serfboundRecoverableState = "stored-data-error";
    renderGeneratedScene();
    const state = getDataStateElement(root);
    const detail = getDataDetailElement(root);
    state.textContent = "Saved data could not be read";
    detail.textContent = "Clear it and import SPAU.PA again.";
    root.dataset.serfboundDataError = errorMessage(error);
    root.dataset.serfboundActiveDataSource = "none";
    setSourceState(root, "Saved data");
    syncGameReadiness(root);
    setResetEnabled(root, true);
  }
}

function applyParsedCatalogState(
  root: HTMLElement,
  catalog: DosPaCatalog,
  source: "persisted" | "restored",
  record?: StoredImportedArchiveRecord,
): void {
  const state = getDataStateElement(root);
  const detail = getDataDetailElement(root);
  root.dataset.serfboundDataState = "supported";
  root.dataset.serfboundCatalogState = "parsed";
  root.dataset.serfboundStorageState = "persisted";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundActiveDataSource = "imported-dos-pa";
  state.textContent = "Data imported";
  detail.textContent =
    source === "restored" && record !== undefined
      ? `${record.normalizedName} restored with ${catalog.entrySummary.defined} resources.`
      : `${catalog.entrySummary.defined} resources loaded and saved.`;
  setSourceState(root, "Imported data");
  syncGameReadiness(root);
  setResetEnabled(root, true);
}

async function clearSelectedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  const result = await clearImportedArchiveRecord(importedArchiveStore);
  if (result.state === "error") {
    applyStorageErrorState(root, `Could not clear local data: ${result.message}`);
    return;
  }

  root.dataset.serfboundDataState = "missing";
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "cleared";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundGameState = "setup";
  root.dataset.serfboundActiveDataSource = "none";
  renderGeneratedScene();
  getDataStateElement(root).textContent = "No game data";
  getDataDetailElement(root).textContent = "Saved data cleared. Import SPAU.PA to start.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
  setResetEnabled(root, false);
}

async function clearSelectedLicensedPackage(
  root: HTMLElement,
  licensedAssetPackageStore: LicensedAssetPackageStore,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  const result = await clearLicensedAssetPackageRecord(licensedAssetPackageStore);
  if (result.state === "error") {
    applyStorageErrorState(root, `Could not clear licensed package: ${result.message}`);
    return;
  }

  root.dataset.serfboundLicensedAssetState = "cleared";
  root.dataset.serfboundLicensedAssetCache = "empty";
  root.dataset.serfboundDataState = "missing";
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "cleared";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundGameState = "setup";
  root.dataset.serfboundActiveDataSource = "none";
  renderGeneratedScene();
  getDataStateElement(root).textContent = "No game data";
  getDataDetailElement(root).textContent = "Licensed package cache cleared. Import SPAU.PA to start.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
  setResetEnabled(root, false);
}

function applyStorageErrorState(
  root: HTMLElement,
  message: string,
  canClearStoredData = false,
): void {
  root.dataset.serfboundStorageState = "error";
  root.dataset.serfboundRecoverableState = "storage-error";
  root.dataset.serfboundStorageMessage = message;
  root.dataset.serfboundActiveDataSource = "none";
  getDataStateElement(root).textContent = "Saved data unavailable";
  getDataDetailElement(root).textContent = canClearStoredData
    ? "Clear saved data and import SPAU.PA again."
    : "Try importing SPAU.PA again.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
  setResetEnabled(root, canClearStoredData);
}

// Work-loop sounds: products map to the reference clips of the labor
// that produced them (Audio.TypeSfx).
const productionSfx: Readonly<Record<number, number>> = {
  6: sfxType.treeFall, // lumber
  7: sfxType.sawing, // plank
  9: sfxType.pickBlow, // stone
  3: sfxType.mowing, // wheat
  4: sfxType.millGrinding, // flour
  1: sfxType.pigOink, // pig
  10: sfxType.pickBlow, // iron ore
  12: sfxType.pickBlow, // coal
  13: sfxType.pickBlow, // gold ore
  11: sfxType.goldBoils, // steel
  14: sfxType.goldBoils, // gold bar
  24: sfxType.metalHammering, // sword
  25: sfxType.metalHammering, // shield
};

// Engine building type value -> the command router's buildingKind name.
function buildingKindNameOf(value: number): string {
  const entry = Object.entries(buildingType).find(([, typeValue]) => typeValue === value);
  return entry === undefined ? "lumberjack" : entry[0];
}

function renderScene(
  root: HTMLElement,
  typedAssetCatalog: TypedAssetCatalog | undefined,
  decodedAssets: DecodedRenderAssets | undefined,
  landscapeAssets: LandscapeRenderAssets | undefined,
  world: SerfboundLocalGame["world"] extends () => infer W ? W | undefined : never,
  serfs: readonly { position: number; animation: number; counter: number }[] | undefined,
  scroll: MapScroll,
  tick: number,
  builtStructures: readonly SerfboundBuiltStructure[] = [],
  panelButtons?: readonly number[],
  popup?: PopupKind,
  notice?: string,
  initScreen?: InitScreenSettings,
  audio?: { sfxMuted: boolean; musicMuted: boolean },
  selected?: { readonly column: number; readonly row: number },
  roadPreview?: { readonly positions: readonly number[] },
): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }

  const size = resizeCanvasToDisplayedSize(canvas);
  const scene =
    landscapeAssets !== undefined
      ? createLandscapeScene({
          size,
          assets: landscapeAssets,
          scroll,
          tick,
          builtStructures,
          ...(world === undefined ? {} : { world }),
          ...(serfs === undefined ? {} : { serfs }),
          ...(panelButtons === undefined ? {} : { panel: { buttons: panelButtons } }),
          ...(popup === undefined ? {} : { popup: { kind: popup } }),
          ...(notice === undefined ? {} : { notice }),
          ...(audio === undefined ? {} : { audio }),
          ...(selected === undefined ? {} : { selected }),
          ...(roadPreview === undefined ? {} : { roadPreview }),
          ...(decodedAssets === undefined
            ? {}
            : { definedArchiveEntries: decodedAssets.definedArchiveEntries }),
          view: { scale: effectiveWorldScale() },
          pixelRatio: canvasPixelRatio,
        })
      : createFirstRenderLayerScene({
          size,
          builtStructures,
          ...(typedAssetCatalog === undefined ? {} : { typedAssetCatalog }),
          ...(decodedAssets === undefined ? {} : { decodedAssets }),
          ...(initScreen === undefined ? {} : { initScreen }),
          pixelRatio: canvasPixelRatio,
        });
  root.dataset.serfboundScroll = `${scroll.column},${scroll.row}`;
  root.dataset.serfboundSceneMode = landscapeAssets !== undefined ? "landscape" : "preview";

  renderFirstRenderLayerScene(canvas, scene);
  root.dataset.serfboundRenderer = scene.renderer;
  root.dataset.serfboundSceneSource = scene.assetSummary.source;
  root.dataset.serfboundLayerCount = String(scene.layers.length);
  root.dataset.serfboundPrimitiveCount = String(scene.primitives.length);
  root.dataset.serfboundSpriteCount = String(scene.sprites.length);
  root.dataset.serfboundSerfSpriteCount = String(
    scene.sprites.filter((sprite) => sprite.key.startsWith("serf")).length,
  );
  root.dataset.serfboundBuiltStructureCount = String(builtStructures.length);
  root.dataset.serfboundCanvasWidth = String(canvas.width);
  root.dataset.serfboundCanvasHeight = String(canvas.height);
  root.dataset.serfboundPixelRatio = String(canvasPixelRatio);
  root.dataset.serfboundViewScale = String(effectiveWorldScale());

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
  }

  // A running catalog-mode game owns its status texts (the settlement
  // map summary); re-renders must not clobber them.
  if (
    scene.assetSummary.source === "dos-pa-catalog" &&
    root.dataset.serfboundGameState === "running"
  ) {
    return;
  }

  if (scene.assetSummary.source === "dos-pa-decoded") {
    sceneState.textContent = "Imported terrain";
    sceneDetail.textContent =
      `Authentic terrain decoded: ${scene.sprites.length} sprites on screen.`;
    return;
  }

  sceneState.textContent =
    scene.assetSummary.source === "dos-pa-catalog" ? "Imported terrain" : "Preview terrain";
  sceneDetail.textContent =
    scene.assetSummary.source === "dos-pa-catalog"
      ? `${scene.assetSummary.definedArchiveEntries ?? 0} resources are ready for play.`
      : "Select land to inspect it.";
}

function attachPointerMapInteraction(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  handlers: PointerMapInteractionHandlers,
): void {
  // Touch defers actions to pointerup (SB-21-04): a quick tap acts, a
  // moved finger is a drag, a second finger is a gesture, and a 500ms
  // hold inspects the tile. Mouse keeps acting on pointerdown.
  let touchTap:
    | { readonly pointerId: number; readonly x: number; readonly y: number; consumed: boolean }
    | undefined;
  // The touch founding confirmation (SB-34-02).
  let pendingCastleTile: { readonly column: number; readonly row: number } | undefined;
  let longPressTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelLongPress = (): void => {
    if (longPressTimer !== undefined) {
      clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
  };
  const touchSlopCssPixels = 12;

  const performInteraction = (event: Pick<PointerEvent, "clientX" | "clientY" | "pointerType">): void => {
    const interaction = resolveCanvasPointer(canvas, event, handlers.landscapeContext());

    // The panel bar sits above the map: its clicks never reach the world.
    if (handlers.panelClick(interaction)) {
      return;
    }

    applyPointerHoverState(root, interaction, event.pointerType);
    applyPointerSelectionState(root, interaction);

    if (handlers.roadModeClick(interaction)) {
      handlers.onSelection(interaction);
      return;
    }

    // Castle placement mode: the founding act. Mouse founds on click
    // (the original behavior, hover-previewed); touch requires a
    // confirming second tap on the same tile (SB-34-02 — a thumb must
    // never found a realm by accident).
    if (handlers.worldCastlePending()) {
      const sameTile =
        pendingCastleTile !== undefined &&
        pendingCastleTile.column === interaction.tile.column &&
        pendingCastleTile.row === interaction.tile.row;
      if (event.pointerType === "touch" && !sameTile) {
        pendingCastleTile = { column: interaction.tile.column, row: interaction.tile.row };
        root.dataset.serfboundCastleConfirm = `${interaction.tile.column},${interaction.tile.row}`;
        const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
        const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
        if (state !== null && detail !== null) {
          state.textContent = "Found your castle here?";
          detail.textContent = "Tap the same tile again to confirm.";
        }

        handlers.onNotice?.(uiText("notice.castleConfirm"));
        applyPointerSelectionState(root, interaction);
        handlers.onSelection(interaction);
        return;
      }

      const castleResult = handlers.commandRouter().dispatch({
        type: "game.build-castle",
        source: "pointer",
        tile: interaction.tile,
      });
      applyCommandResultState(root, castleResult);
      if (castleResult.status === "accepted") {
        pendingCastleTile = undefined;
        root.dataset.serfboundCastleConfirm = "confirmed";
        handlers.onWorldChanged();
      } else if (event.pointerType === "touch") {
        // The confirmed site was invalid: release the pending state so
        // the next tap proposes a fresh site instead of stranding.
        pendingCastleTile = undefined;
        delete root.dataset.serfboundCastleConfirm;
      }

      handlers.onSelection(interaction);
      return;
    }

    applyCommandResultState(
      root,
      handlers.commandRouter().dispatch({
        type: "debug.inspect-map-tile",
        source: "pointer",
        map: interaction.map,
        tile: interaction.tile,
      }),
    );
    handlers.onSelection(interaction);
  };

  canvas.addEventListener("pointermove", (event) => {
    if (touchTap !== undefined && event.pointerId === touchTap.pointerId) {
      if (
        Math.hypot(event.clientX - touchTap.x, event.clientY - touchTap.y) > touchSlopCssPixels
      ) {
        touchTap = undefined;
        cancelLongPress();
      }
    }

    const interaction = resolveCanvasPointer(canvas, event, handlers.landscapeContext());
    applyPointerHoverState(root, interaction, event.pointerType);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") {
      performInteraction(event);
      return;
    }

    if (gestureTracker.isSecondaryTouch(event.pointerId)) {
      // A second finger: this interaction is a gesture, not a tap.
      touchTap = undefined;
      cancelLongPress();
      return;
    }

    const tap = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, consumed: false };
    touchTap = tap;
    cancelLongPress();
    const downPoint = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
    };
    longPressTimer = setTimeout(() => {
      longPressTimer = undefined;
      if (touchTap !== tap) {
        return;
      }

      // Long-press: the tile inspect path, never a build action.
      tap.consumed = true;
      const interaction = resolveCanvasPointer(canvas, downPoint, handlers.landscapeContext());
      applyPointerHoverState(root, interaction, "touch");
      applyPointerSelectionState(root, interaction);
      applyCommandResultState(
        root,
        handlers.commandRouter().dispatch({
          type: "debug.inspect-map-tile",
          source: "pointer",
          map: interaction.map,
          tile: interaction.tile,
        }),
      );
      handlers.onSelection(interaction);
      root.dataset.serfboundLongPress = `${interaction.tile.column},${interaction.tile.row}`;
    }, 500);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") {
      return;
    }

    cancelLongPress();
    const tap = touchTap;
    touchTap = undefined;
    if (gestureTracker.consumeClickSuppression()) {
      return;
    }

    if (
      tap === undefined ||
      tap.consumed ||
      tap.pointerId !== event.pointerId ||
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > touchSlopCssPixels
    ) {
      return;
    }

    performInteraction(event);
  });

  canvas.addEventListener("pointerleave", (event) => {
    // Touch pointers "leave" after every lift — wiping the state then
    // erases the player's own selection an instant after they made it
    // (SB-34 punch 2). Only a departing mouse clears the hover.
    if (event.pointerType === "touch") {
      return;
    }

    root.dataset.serfboundPointerState = "idle";
    getPointerStateElement(root).textContent = "No map target";
    getPointerDetailElement(root).textContent = "Move over the map.";
  });
}

function resolveCanvasPointer(
  canvas: HTMLCanvasElement,
  event: Pick<PointerEvent, "clientX" | "clientY">,
  landscapeContext?: PointerLandscapeContext,
): PointerMapInteraction {
  const rect = canvas.getBoundingClientRect();
  // Events arrive in CSS pixels; hit tests and scenes work in canvas
  // (device) pixels.
  const toCanvasX = rect.width === 0 ? 1 : canvas.width / rect.width;
  const toCanvasY = rect.height === 0 ? 1 : canvas.height / rect.height;
  const screen = {
    x: (event.clientX - rect.left) * toCanvasX,
    y: (event.clientY - rect.top) * toCanvasY,
  };

  if (landscapeContext !== undefined) {
    const worldScale = effectiveWorldScale();
    const tile = screenToMapTile(
      landscapeContext.landscape,
      screen,
      landscapeContext.scroll,
      worldScale,
    );
    return {
      screen,
      view: screen,
      map: { x: screen.x / worldScale, y: screen.y / worldScale },
      tile,
    };
  }

  // The decoded preview map scales by the device pixel ratio; resolve
  // the tile in its map space but keep the canvas-pixel screen point
  // (UI hit tests work in canvas pixels).
  const previewScale = devicePixelScale();
  const preview = resolveFirstRenderLayerPointer(
    { x: screen.x / previewScale, y: screen.y / previewScale },
    { width: canvas.width / previewScale, height: canvas.height / previewScale },
  );
  return { ...preview, screen, view: screen };
}

function applyPointerHoverState(
  root: HTMLElement,
  interaction: PointerMapInteraction,
  pointerType: string,
): void {
  root.dataset.serfboundPointerState = "hover";
  root.dataset.serfboundPointerType = pointerType;
  root.dataset.serfboundHoverTile = `${interaction.tile.column},${interaction.tile.row}`;
  root.dataset.serfboundHoverPosition = String(interaction.tile.position);
  root.dataset.serfboundHoverMap = `${Math.round(interaction.map.x)},${Math.round(interaction.map.y)}`;
  getPointerStateElement(root).textContent = `Hover ${interaction.tile.column},${interaction.tile.row}`;
  getPointerDetailElement(root).textContent =
    `Map ${Math.round(interaction.map.x)},${Math.round(interaction.map.y)} via ${pointerType || "pointer"}`;
}

function applyPointerSelectionState(root: HTMLElement, interaction: PointerMapInteraction): void {
  root.dataset.serfboundPointerState = "selected";
  root.dataset.serfboundSelectedTile = `${interaction.tile.column},${interaction.tile.row}`;
  root.dataset.serfboundSelectedPosition = String(interaction.tile.position);
  getPointerStateElement(root).textContent = `Selected ${interaction.tile.column},${interaction.tile.row}`;
  getSelectedTileStateElement(root).textContent = `Tile ${interaction.tile.column},${interaction.tile.row}`;
  getSelectedTileDetailElement(root).textContent =
    `Position ${interaction.tile.position} - map ${Math.round(interaction.map.x)},${Math.round(interaction.map.y)}`;
}

function syncWorldState(
  root: HTMLElement,
  world:
    | {
        players: readonly { hasCastle: boolean }[];
        flags: ReadonlyMap<number, unknown>;
        buildings: ReadonlyMap<number, { isDone: boolean }>;
      }
    | undefined,
): void {
  if (world === undefined) {
    delete root.dataset.serfboundWorldHasCastle;
    delete root.dataset.serfboundWorldFlagCount;
    delete root.dataset.serfboundWorldBuildingCount;
    delete root.dataset.serfboundWorldBuildingDoneCount;
    delete root.dataset.serfboundStockSummary;
    delete root.dataset.serfboundMilitarySummary;
    return;
  }

  const hasCastle = world.players[0]?.hasCastle ?? false;
  root.dataset.serfboundWorldHasCastle = String(hasCastle);
  // Conquest end state: the castle fell (Game.PlayerDefeated).
  const defeated =
    (world.players[0] as { defeated?: boolean } | undefined)?.defeated ?? false;
  root.dataset.serfboundGameOver = String(defeated);
  if (defeated) {
    const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
    const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
    if (state !== null && detail !== null) {
      state.textContent = "Game over";
      detail.textContent = "Your castle has fallen.";
    }
  }
  const roadButton = root.querySelector<HTMLButtonElement>("[data-testid='build-road-button']");
  if (roadButton !== null) {
    roadButton.disabled = !hasCastle;
  }
  const lumberjackButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='build-lumberjack-button']",
  );
  if (lumberjackButton !== null) {
    lumberjackButton.disabled = !hasCastle;
  }
  root.dataset.serfboundWorldFlagCount = String(world.flags.size);
  root.dataset.serfboundWorldBuildingCount = String(world.buildings.size);
  root.dataset.serfboundWorldBuildingDoneCount = String(
    [...world.buildings.values()].filter((building) => building.isDone).length,
  );
  // Live economy stats: the castle stock's key lines (Phase 16's stats
  // popups render the full table from the same source).
  const inventory = (world as {
    inventoryForPlayer?: (p: number) => { resources: Uint32Array; knights: number } | null;
  }).inventoryForPlayer?.(0);
  if (inventory !== undefined && inventory !== null) {
    root.dataset.serfboundStockSummary = [
      `plank:${inventory.resources[7]}`,
      `stone:${inventory.resources[9]}`,
      `lumber:${inventory.resources[6]}`,
      `bread:${inventory.resources[5]}`,
      `steel:${inventory.resources[11]}`,
    ].join(",");
    const player = world.players[0] as
      | { knightMorale?: number }
      | undefined;
    root.dataset.serfboundMilitarySummary = [
      `sword:${inventory.resources[24]}`,
      `shield:${inventory.resources[25]}`,
      `knight:${inventory.knights}`,
      `morale:${player?.knightMorale ?? 0}`,
    ].join(",");
  }

  if (!hasCastle && root.dataset.serfboundGameState === "running") {
    const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
    const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
    if (state !== null && detail !== null) {
      state.textContent = "Place your castle";
      detail.textContent = "Select open land to found your settlement.";
    }
  }
}

// The reference event-to-clip mapping for commands: accepted actions
// click in, rejected ones refuse (Audio.TypeSfx Accepted/NotAccepted).
let activeAudioService: SerfboundAudioService | undefined;

function applyCommandResultState(root: HTMLElement, result: SerfboundCommandResult): void {
  if (activeAudioService !== undefined) {
    activeAudioService.playSfx(result.status === "accepted" ? sfxType.accepted : sfxType.notAccepted);
    root.dataset.serfboundLastSfx = String(activeAudioService.lastSfx ?? "");
  }

  root.dataset.serfboundCommandState = result.status;
  if (result.status === "accepted") {
    root.dataset.serfboundLastEffect = result.effect;
  } else {
    delete root.dataset.serfboundLastEffect;
  }
  root.dataset.serfboundCommandId = String(result.commandId);
  root.dataset.serfboundCommandLogLength = String(result.snapshot.commandLogLength);
  root.dataset.serfboundBuiltStructureCount = String(result.snapshot.builtStructures.length);

  if (result.status === "accepted") {
    root.dataset.serfboundCommandType = result.command.type;
    delete root.dataset.serfboundCommandReason;
    if (result.effect === "flag-built" && result.builtStructure !== undefined) {
      const tile = result.builtStructure.tile;
      root.dataset.serfboundLastBuiltStructure = `flag:${tile.column},${tile.row}`;
      getCommandStateElement(root).textContent = "Flag built";
      getCommandDetailElement(root).textContent =
        `Flag placed at tile ${tile.column},${tile.row}.`;
      return;
    }

    if (result.effect === "castle-built") {
      getCommandStateElement(root).textContent = "Castle founded";
      getCommandDetailElement(root).textContent =
        `Your castle stands at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    if (result.effect === "world-flag-built") {
      getCommandStateElement(root).textContent = "Flag built";
      getCommandDetailElement(root).textContent =
        `Flag placed at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    if (result.effect === "road-built") {
      getCommandStateElement(root).textContent = "Road built";
      getCommandDetailElement(root).textContent = "Your flags are connected.";
      return;
    }

    if (result.effect === "building-built") {
      getCommandStateElement(root).textContent = "Construction started";
      getCommandDetailElement(root).textContent =
        `Builders raise a new building at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    getCommandStateElement(root).textContent = "Inspect land";
    getCommandDetailElement(root).textContent =
      `Tile ${result.command.tile.column},${result.command.tile.row} is selected.`;
    return;
  }

  if (result.commandType === undefined) {
    delete root.dataset.serfboundCommandType;
  } else {
    root.dataset.serfboundCommandType = result.commandType;
  }

  root.dataset.serfboundCommandReason = result.reason;
  getCommandStateElement(root).textContent = "Action unavailable";
  getCommandDetailElement(root).textContent =
    result.reason === "tile-occupied"
      ? "That tile already has a flag. Select another tile."
      : result.message;
}

function syncBuildFlagEnabled(
  root: HTMLElement,
  selectedInteraction: PointerMapInteraction | undefined,
  builtStructures: readonly SerfboundBuiltStructure[],
): void {
  const buildFlagButton = getBuildFlagButton(root);
  const selectedTile = selectedInteraction?.tile;
  const isRunning = root.dataset.serfboundGameState === "running";
  const tileOccupied =
    selectedTile !== undefined &&
    builtStructures.some((structure) => structure.tile.position === selectedTile.position);
  const canBuild = isRunning && selectedTile !== undefined && !tileOccupied;
  buildFlagButton.disabled = !canBuild;

  if (selectedTile === undefined || root.dataset.serfboundCommandState !== "accepted") {
    return;
  }

  if (canBuild) {
    getCommandStateElement(root).textContent = "Build flag available";
    getCommandDetailElement(root).textContent =
      `Place a flag at tile ${selectedTile.column},${selectedTile.row}.`;
    return;
  }

  if (tileOccupied && root.dataset.serfboundCommandType !== "game.build") {
    getCommandStateElement(root).textContent = "Flag built";
    getCommandDetailElement(root).textContent =
      `Flag already stands at tile ${selectedTile.column},${selectedTile.row}.`;
  }
}

function applyLocalGameStartResult(
  root: HTMLElement,
  result: SerfboundLocalGameStartResult,
): void {
  if (result.status === "rejected") {
    root.dataset.serfboundLocalGameState = "rejected";
    root.dataset.serfboundLocalGameRejectReason = result.reason;
    root.dataset.serfboundGameState = "setup";
    getGameStateElement(root).textContent = "Data needed";
    getGameDetailElement(root).textContent = "Game data is required before starting a local game.";
    getStartGameButton(root).disabled = root.dataset.serfboundDataState !== "supported";
    return;
  }

  applyRunningLocalGameSnapshot(root, result.snapshot);
}

function applyRunningLocalGameSnapshot(
  root: HTMLElement,
  snapshot: SerfboundLocalGameSnapshot,
): void {
  root.dataset.serfboundGameState = "running";
  root.dataset.serfboundStartMode =
    snapshot.data.kind === "licensed-asset-package" ? "licensed-package" : "imported-data";
  root.dataset.serfboundLocalGameState = "running";
  root.dataset.serfboundLocalGameMode = snapshot.mode;
  root.dataset.serfboundLocalGameSeed = snapshot.settings.seedString;
  root.dataset.serfboundLocalGameMapSize = String(snapshot.settings.mapSize);
  root.dataset.serfboundLocalGameMapTiles = String(snapshot.state.map.tileCount);
  root.dataset.serfboundLocalGameDataEntries = String(snapshot.data.entryCount);
  delete root.dataset.serfboundLocalGameRejectReason;
  getGameStateElement(root).textContent = "Running";
  getGameDetailElement(root).textContent =
    `Local game started: map ${snapshot.state.map.columns}x${snapshot.state.map.rows}.`;
  getSceneStateElement(root).textContent = "Settlement map";
  getSceneDetailElement(root).textContent =
    `${snapshot.data.definedArchiveEntries} resources initialized with seed ${snapshot.settings.seedString}.`;
  const startButton = getStartGameButton(root);
  startButton.textContent = "Running";
  startButton.disabled = true;
}

function applyLocalGameSaveAvailableState(
  root: HTMLElement,
  record: StoredLocalGameSaveRecord,
): void {
  root.dataset.serfboundLocalSaveState = "available";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Saved game";
  getSaveDetailElement(root).textContent =
    `${record.snapshot.state.builtStructures.length} built structures saved.`;
}

function applyLocalGameLoadedState(
  root: HTMLElement,
  record: StoredLocalGameSaveRecord,
): void {
  root.dataset.serfboundLocalSaveState = "loaded";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Game loaded";
  getSaveDetailElement(root).textContent =
    `${record.snapshot.state.builtStructures.length} built structures restored.`;
}

function applyNoLocalGameSaveState(
  root: HTMLElement,
  stateText: string,
  detailText: string,
): void {
  root.dataset.serfboundLocalSaveState = "empty";
  getSaveStateElement(root).textContent = stateText;
  getSaveDetailElement(root).textContent = detailText;
}

function applyLocalGameSaveErrorState(root: HTMLElement, message: string): void {
  root.dataset.serfboundLocalSaveState = "error";
  root.dataset.serfboundRecoverableState = "save-error";
  root.dataset.serfboundLocalSaveMessage = message;
  getSaveStateElement(root).textContent = "Save unavailable";
  getSaveDetailElement(root).textContent = message;
}

function syncLocalGameSaveControls(
  root: HTMLElement,
  currentLocalGameSnapshot: SerfboundLocalGameSnapshot | undefined,
  currentSavedLocalGame: StoredLocalGameSaveRecord | undefined,
  currentImportedDataSource: SerfboundLocalGameDataSource | undefined,
): void {
  getSaveGameButton(root).disabled =
    root.dataset.serfboundGameState !== "running" || currentLocalGameSnapshot === undefined;
  getLoadGameButton(root).disabled =
    currentSavedLocalGame === undefined ||
    currentImportedDataSource === undefined ||
    !localGameDataSourcesMatch(currentImportedDataSource, currentSavedLocalGame.dataSource);
  getClearSaveButton(root).disabled =
    currentSavedLocalGame === undefined && root.dataset.serfboundLocalSaveState !== "error";
}

function localGameDataSourcesMatch(
  left: SerfboundLocalGameDataSource,
  right: SerfboundLocalGameDataSource,
): boolean {
  return (
    left.kind === right.kind &&
    left.archiveName === right.archiveName &&
    left.byteLength === right.byteLength &&
    left.entryCount === right.entryCount &&
    left.definedArchiveEntries === right.definedArchiveEntries &&
    left.fixupCount === right.fixupCount &&
    (left.kind !== "licensed-asset-package" ||
      (right.kind === "licensed-asset-package" &&
        left.packageFormatVersion === right.packageFormatVersion &&
        left.packageChecksum === right.packageChecksum))
  );
}

function syncGameReadiness(root: HTMLElement): void {
  if (root.dataset.serfboundGameState === "running") {
    return;
  }

  const hasImportedData = root.dataset.serfboundDataState === "supported";
  const sourceKind = root.dataset.serfboundActiveDataSource;
  root.dataset.serfboundGameState = hasImportedData ? "ready" : "setup";
  root.dataset.serfboundStartMode = hasImportedData
    ? sourceKind === "licensed-asset-package"
      ? "licensed-package"
      : "imported-data"
    : "import-required";
  root.dataset.serfboundLocalGameState = "none";
  getGameStateElement(root).textContent = hasImportedData ? "Ready" : "Data needed";
  getGameDetailElement(root).textContent = hasImportedData
    ? sourceKind === "licensed-asset-package"
      ? "Licensed package is ready. Start when prepared."
      : "Imported data is ready. Start when prepared."
    : "Load game data first.";
  const startButton = getStartGameButton(root);
  startButton.textContent = "Start game";
  startButton.disabled = !hasImportedData;
  // The map editor's render is import-gated (authentic tiles), so the
  // entry only enables once data is imported (SB-42-05).
  const editorButton = root.querySelector<HTMLButtonElement>("[data-testid='open-editor-button']");
  if (editorButton !== null) {
    editorButton.disabled = !hasImportedData;
  }
}

function localGameDataSourceFromCatalog(
  catalog: DosPaCatalog,
  archiveName: string,
): SerfboundLocalGameDataSource {
  return {
    kind: "imported-dos-pa-catalog",
    archiveName,
    byteLength: catalog.header.declaredSize,
    entryCount: catalog.header.entryCount,
    definedArchiveEntries: catalog.entrySummary.defined,
    fixupCount: catalog.fixupSummary.count,
  };
}

function localGameDataSourceFromLicensedPackage(
  record: StoredLicensedAssetPackageRecord,
): SerfboundLocalGameDataSource {
  return {
    kind: "licensed-asset-package",
    archiveName: record.archiveName,
    byteLength: record.byteLength,
    entryCount: record.entryCount,
    definedArchiveEntries: record.definedArchiveEntries,
    fixupCount: record.fixupCount,
    packageFormatVersion: record.formatVersion,
    packageChecksum: record.packageChecksum.value,
    permissionRecord: record.permissionRecord,
  };
}

function getPointerStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='pointer-state']");
  if (state === null) {
    throw new Error("Serfbound shell pointer state did not mount.");
  }

  return state;
}

function getPointerDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='pointer-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell pointer detail did not mount.");
  }

  return detail;
}

function getSelectedTileStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='selected-tile-state']");
  if (state === null) {
    throw new Error("Serfbound shell selected tile state did not mount.");
  }

  return state;
}

function getSelectedTileDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='selected-tile-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell selected tile detail did not mount.");
  }

  return detail;
}

function getCommandStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
  if (state === null) {
    throw new Error("Serfbound shell command state did not mount.");
  }

  return state;
}

function getCommandDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell command detail did not mount.");
  }

  return detail;
}

function getSaveStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='save-state']");
  if (state === null) {
    throw new Error("Serfbound shell save state did not mount.");
  }

  return state;
}

function getSaveDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='save-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell save detail did not mount.");
  }

  return detail;
}

function getGameStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='game-state']");
  if (state === null) {
    throw new Error("Serfbound shell game state did not mount.");
  }

  return state;
}

function getGameDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='game-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell game detail did not mount.");
  }

  return detail;
}

function getSceneStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  if (state === null) {
    throw new Error("Serfbound shell scene state did not mount.");
  }

  return state;
}

function getSceneDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell scene detail did not mount.");
  }

  return detail;
}

function getStartGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='start-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell start button did not mount.");
  }

  return button;
}

function getBuildFlagButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='build-flag-button']");
  if (button === null) {
    throw new Error("Serfbound shell build flag button did not mount.");
  }

  return button;
}

function getSaveGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='save-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell save game button did not mount.");
  }

  return button;
}

function getLoadGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='load-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell load game button did not mount.");
  }

  return button;
}

function getClearSaveButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='clear-save-button']");
  if (button === null) {
    throw new Error("Serfbound shell clear save button did not mount.");
  }

  return button;
}

function observeSceneResize(canvas: HTMLCanvasElement, renderCurrentScene: () => void): void {
  if (typeof ResizeObserver === "undefined") {
    globalThis.addEventListener("resize", renderCurrentScene);
    return;
  }

  let animationFrame = 0;
  const observer = new ResizeObserver(() => {
    if (animationFrame !== 0) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      renderCurrentScene();
    });
  });

  observer.observe(canvas);
}

// SB-21-03: the canvas backing store renders at native device
// resolution; UI chrome and the world view scale up to keep their
// apparent size, pixel-sharp. The ratio is clamped against degenerate
// browser values.
let canvasPixelRatio = 1;
// The player's world view scale choice; null follows the screen (the
// integer device pixel ratio), the modern default "SVGA" mode.
let worldViewScaleChoice: number | null = null;

function devicePixelScale(): number {
  return Math.max(1, Math.round(canvasPixelRatio));
}

function effectiveWorldScale(): number {
  return worldViewScaleChoice ?? devicePixelScale();
}

export function cycleWorldViewScale(): number {
  const next = (effectiveWorldScale() % 3) + 1;
  worldViewScaleChoice = next;
  return next;
}

// Pinch-zoom steps the view scale one notch at a time (SB-21-04).
export function stepWorldViewScale(direction: 1 | -1): number {
  const next = Math.max(1, Math.min(3, effectiveWorldScale() + direction));
  worldViewScaleChoice = next;
  return next;
}

// Shared multi-touch tracker (SB-21-04): the scroll/gesture handlers and
// the map interaction handlers coordinate through it (one canvas per
// shell).
const gestureTracker = new PointerGestureTracker();

function resizeCanvasToDisplayedSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  canvasPixelRatio = Math.max(1, Math.min(4, globalThis.devicePixelRatio || 1));
  const width = Math.max(1, Math.round(rect.width * canvasPixelRatio));
  const height = Math.max(1, Math.round(rect.height * canvasPixelRatio));

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  return { width, height };
}

function getDataStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  if (state === null) {
    throw new Error("Serfbound shell data state did not mount.");
  }

  return state;
}

function getDataDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell data detail did not mount.");
  }

  return detail;
}

function setSourceState(root: HTMLElement, text: string): void {
  const sourceState = root.querySelector<HTMLElement>("[data-testid='source-state']");
  if (sourceState === null) {
    throw new Error("Serfbound shell source state did not mount.");
  }

  sourceState.textContent = text;
  const dataSourceState = root.querySelector<HTMLElement>("[data-testid='data-source-state']");
  if (dataSourceState === null) {
    throw new Error("Serfbound shell data source state did not mount.");
  }

  dataSourceState.textContent = text;
}

function setResetEnabled(root: HTMLElement, enabled: boolean): void {
  const resetButton = root.querySelector<HTMLButtonElement>("[data-testid='data-reset-button']");
  if (resetButton === null) {
    throw new Error("Serfbound shell reset button did not mount.");
  }

  resetButton.disabled = !enabled;
}
