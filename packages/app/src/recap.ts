import type {
  CorrespondenceMatch,
  CorrespondenceMoveReplay,
  CorrespondenceMoveVerdict,
  CorrespondenceWindowMove,
  WindowDigest,
} from "@serfbound/engine";
import { uiText } from "./strings.js";

// The recap (SB-23-02): "while you waited, your opponent did X" — and
// you can watch it. The driver wraps the engine's stepped move replay
// so the shell advances it a chunk per animation frame, rendering the
// world between chunks, then finishes with the trustless verification.

export type RecapDriverStart =
  | { readonly ok: true; readonly driver: RecapDriver }
  | { readonly ok: false; readonly reason: string; readonly message: string };

export type RecapDriver = {
  // Advance one frame's worth of replay; returns true when the window
  // is fully replayed (or failed) and finish() should be called.
  advanceFrame(): boolean;
  readonly tick: number;
  readonly done: boolean;
  finish(): CorrespondenceMoveVerdict;
};

// ~16x game speed at the shell's 175ms frame cadence.
export const defaultRecapTicksPerFrame = 128;

export function createRecapDriver(
  match: CorrespondenceMatch,
  move: CorrespondenceWindowMove,
  ticksPerFrame = defaultRecapTicksPerFrame,
): RecapDriverStart {
  const start = match.beginMoveReplay(move);
  if (!start.ok) {
    return start;
  }

  const replay: CorrespondenceMoveReplay = start.replay;
  return {
    ok: true,
    driver: {
      advanceFrame(): boolean {
        replay.advance(ticksPerFrame);
        return replay.done;
      },
      get tick(): number {
        return replay.tick;
      },
      get done(): boolean {
        return replay.done;
      },
      finish(): CorrespondenceMoveVerdict {
        return replay.finish();
      },
    },
  };
}

// Digest lines in the game font's alphabet (A-Z, digits, . - : ? % —
// no '+', so deltas spell out gains as plain numbers and losses with
// '-').
export function digestLines(digest: WindowDigest): string[] {
  const lines = [
    uiText("digest.header", { window: digest.window + 1, player: digest.activePlayer + 1 }),
  ];
  for (const player of digest.players) {
    const parts = [uiText("digest.seat", { player: player.player + 1 })];
    if (player.buildingsStarted !== 0) {
      parts.push(uiText("digest.built", { value: player.buildingsStarted }));
    }

    if (player.buildingsCompleted !== 0) {
      parts.push(uiText("digest.completed", { value: player.buildingsCompleted }));
    }

    if (player.flagsBuilt !== 0) {
      parts.push(uiText("digest.flags", { value: player.flagsBuilt }));
    }

    if (player.landAreaDelta !== 0) {
      parts.push(uiText("digest.land", { value: player.landAreaDelta }));
    }

    if (player.stockDelta !== 0) {
      parts.push(uiText("digest.stock", { value: player.stockDelta }));
    }

    if (player.serfsDelta !== 0) {
      parts.push(uiText("digest.serfs", { value: player.serfsDelta }));
    }

    lines.push(
      parts.length === 1 ? `${parts[0]} ${uiText("digest.quiet")}` : parts.join(" "),
    );
  }

  return lines;
}
