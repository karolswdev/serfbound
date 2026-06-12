import { sfxType, type SfxTypeValue } from "@serfbound/assets";

// The sound of work (SB-38-05, Render/RenderSerf.cs 852–1430): every
// action's clip is keyed to the animation frame's body-sprite byte.
// The reference's per-serf IsPlayingSfx latch is condensed to
// frame-edge triggering — a clip plays when the serf ENTERS a trigger
// frame, and a held frame stays silent (recorded).

export type WorkSoundContext = {
  // The building type the serf works (0 when none).
  readonly workBuildingType: number;
  // Engine serf state values: building 9, digging 8, prospecting 18,
  // knight fight states 13/14.
  readonly state: number;
  // The logging stage while working (the tree-fall crash rides the
  // last one).
  readonly workStage: number;
  // The frame's body-sprite byte this render, and the previous one.
  readonly frameSprite: number;
  readonly previousFrameSprite: number;
};

const enteredAny = (
  context: WorkSoundContext,
  frames: readonly number[],
): boolean =>
  frames.includes(context.frameSprite) &&
  !frames.includes(context.previousFrameSprite);

// Reference sawmill/butcher pose frames repeat across four windows.
const sawingFrames = [0xb3, 0xb7, 0xbb, 0xbf, 0xc3, 0xc7, 0xcb, 0xcf];
const backswordFrames = [0xb2, 0xba, 0xc2, 0xca];
const fisherIdleFrames = [0x80, 0x87, 0x88, 0x8f];

export function workActionSound(context: WorkSoundContext): SfxTypeValue | null {
  // Fights clash on every new swing frame (Fight01..04 rotate by the
  // frame byte — the reference keys them to the fight animations).
  if (context.state === 13 || context.state === 14) {
    if (
      context.frameSprite >= 0x80 &&
      context.frameSprite !== context.previousFrameSprite
    ) {
      const clips = [
        sfxType.fight01,
        sfxType.fight02,
        sfxType.fight03,
        sfxType.fight04,
      ] as const;
      return clips[context.frameSprite & 3]!;
    }

    return null;
  }

  // The builder's hammer ((frame & 7) == 4 or 5).
  if (context.state === 9) {
    if (
      context.frameSprite >= 0x80 &&
      ((context.frameSprite & 7) === 4 || (context.frameSprite & 7) === 5) &&
      context.frameSprite !== context.previousFrameSprite
    ) {
      return sfxType.hammerBlow;
    }

    return null;
  }

  // The digger's shovel (0x83/0x84).
  if (context.state === 8) {
    return enteredAny(context, [0x83, 0x84]) ? sfxType.digging : null;
  }

  // The geologist's sample tap.
  if (context.state === 18) {
    if (
      context.frameSprite >= 0x80 &&
      context.frameSprite !== context.previousFrameSprite
    ) {
      return sfxType.geologistSampling;
    }

    return null;
  }

  switch (context.workBuildingType) {
    case 2: // lumberjack: the axe, and the crash on the last chop
      if (enteredAny(context, [0x85, 0x86])) {
        return context.workStage >= 4 ? sfxType.treeFall : sfxType.axeBlow;
      }

      return null;
    case 4: // stonecutter
      return enteredAny(context, [0x85, 0x86]) ? sfxType.pickBlow : null;
    case 9: // forester
      return enteredAny(context, [0x86, 0x87]) ? sfxType.planting : null;
    case 17: // sawmill
      return enteredAny(context, sawingFrames) ? sfxType.sawing : null;
    case 13: // butcher
      return enteredAny(context, backswordFrames) ? sfxType.backswordBlow : null;
    case 12: // farmer: the scythe in the field (reference Mowing)
      if (
        context.frameSprite >= 0x80 &&
        context.frameSprite !== context.previousFrameSprite
      ) {
        return sfxType.mowing;
      }

      return null;
    case 1: // fisher: every rod frame that is not an idle hold reels
      if (
        context.frameSprite >= 0x80 &&
        !fisherIdleFrames.includes(context.frameSprite) &&
        context.frameSprite !== context.previousFrameSprite
      ) {
        return sfxType.fishingRodReel;
      }

      return null;
    default:
      return null;
  }
}
