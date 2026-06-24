import {
  CorrespondenceMatch,
  type CorrespondenceWindowMove,
  type SerfboundLocalGameStartOptions,
  type SerfboundWorldAction,
  type WindowDigest,
} from "@serfbound/engine";
import { createRecapDriver, type RecapDriver } from "./recap.js";
import type { IdentityKeys } from "./identity-client.js";
import type { IdentityV2Session } from "./identity-v2-client.js";
import {
  fetchMatch,
  postMove,
  postMoveWithIdentityV2,
  submitResult,
  submitResultWithIdentityV2,
  type MailboxMatchView,
} from "./mailbox-client.js";

// Online correspondence (SB-29-04): the Phase 23 trustless window flow
// with the deployed mailbox as transport. Same shape as the loopback
// controller — each side runs its own full CorrespondenceMatch and
// re-verifies every received move through the recap path; the mailbox
// stores and forwards, never referees. Moves leave through signed
// posts; opponents' moves arrive through polling.

export type OnlineMatchMode =
  | "your-window"
  | "posting"
  | "awaiting-move"
  | "move-arrived"
  | "recap"
  | "ended"
  | "failed";

export type OnlineMatchStatus = {
  readonly matchId: string;
  readonly localPlayer: number;
  readonly mode: OnlineMatchMode;
  readonly window: number;
  readonly checksum: number;
  readonly boundaryChecksum: number | null;
  readonly digest: WindowDigest | null;
  readonly failureReason: string | null;
  readonly opponentName: string | null;
  readonly serviceState: MailboxMatchView["state"] | null;
  readonly winnerSeat: number | null;
};

export class SerfboundOnlineMatch {
  readonly matchId: string;
  readonly localPlayer: number;
  readonly mailboxUrl: string;
  #keys: IdentityKeys | undefined;
  #identityV2Session: IdentityV2Session | undefined;
  #match: CorrespondenceMatch;
  #mode: OnlineMatchMode;
  #outboundMove: CorrespondenceWindowMove | null = null;
  #posting = false;
  #polling = false;
  #pendingMove: CorrespondenceWindowMove | null = null;
  #recap: RecapDriver | null = null;
  #failureReason: string | null = null;
  #opponentName: string | null;
  #serviceState: MailboxMatchView["state"] | null = "active";
  #winnerSeat: number | null = null;
  #onEnded: ((view: MailboxMatchView) => void) | undefined;

  constructor(options: {
    view: MailboxMatchView;
    seat: number;
    keys?: IdentityKeys;
    identityV2Session?: IdentityV2Session;
    mailboxUrl: string;
    data: NonNullable<SerfboundLocalGameStartOptions["data"]>;
    onEnded?: (view: MailboxMatchView) => void;
  }) {
    this.matchId = options.view.matchId;
    this.localPlayer = options.seat;
    this.mailboxUrl = options.mailboxUrl;
    this.#keys = options.keys;
    this.#identityV2Session = options.identityV2Session;
    this.#onEnded = options.onEnded;
    this.#opponentName = options.view.players[1 - options.seat]?.name ?? null;
    const terms = options.view.terms;
    this.#match = new CorrespondenceMatch({
      game: {
        data: options.data,
        seedString: terms.seedString,
        mapSize: terms.mapSize,
        initialSupplies: terms.initialSupplies,
      },
      windowTicks: terms.windowTicks,
      playerCount: terms.playerCount,
    });
    // Window 0 belongs to seat 0 (the challenger); the accepter waits.
    this.#mode = options.seat === 0 ? "your-window" : "awaiting-move";
  }

  get match(): CorrespondenceMatch {
    return this.#match;
  }

  get status(): OnlineMatchStatus {
    return {
      matchId: this.matchId,
      localPlayer: this.localPlayer,
      mode: this.#mode,
      window: this.#match.currentWindow,
      checksum: this.#match.checksum(),
      boundaryChecksum: this.#match.moves.at(-1)?.endChecksum ?? null,
      digest: this.#match.lastWindowDigest,
      failureReason: this.#failureReason,
      opponentName: this.#opponentName,
      serviceState: this.#serviceState,
      winnerSeat: this.#winnerSeat,
    };
  }

  queue(action: SerfboundWorldAction): void {
    if (this.#mode === "your-window") {
      this.#match.queue(action);
    }
  }

  // One shell-timer step: play your window, or drive the recap of a
  // received one. Network sends happen at window boundaries only.
  tick(deltaTicks: number): void {
    if (this.#mode === "your-window") {
      this.#match.advance(deltaTicks);
      if (this.#match.windowComplete) {
        this.#outboundMove = this.#match.takeMove();
        this.#mode = "posting";
        void this.#postOutbound();
      }

      return;
    }

    if (this.#mode === "recap") {
      const recap = this.#recap;
      if (recap === null) {
        return;
      }

      if (recap.advanceFrame()) {
        const verdict = recap.finish();
        this.#recap = null;
        if (!verdict.ok) {
          this.#mode = "failed";
          this.#failureReason = verdict.reason;
          return;
        }

        this.#mode = "your-window";
      }
    }
  }

  // The shell's slow timer: fetch the mailbox view, retry a failed
  // post, surface arrived moves and terminal states. Never throws —
  // an unreachable service just leaves the match where it was.
  async poll(): Promise<void> {
    if (this.#polling) {
      return;
    }

    this.#polling = true;
    try {
      if (this.#outboundMove !== null && !this.#posting) {
        await this.#postOutbound();
      }

      const view = await fetchMatch(this.mailboxUrl, this.matchId);
      this.#apply(view);
    } catch {
      // Unreachable mailbox: stay in the current mode; the next poll
      // retries. The simulation never blocks on the network.
    } finally {
      this.#polling = false;
    }
  }

  pickup(): void {
    if (this.#mode !== "move-arrived" || this.#pendingMove === null) {
      return;
    }

    const start = createRecapDriver(this.#match, this.#pendingMove);
    this.#pendingMove = null;
    if (!start.ok) {
      this.#mode = "failed";
      this.#failureReason = start.reason;
      return;
    }

    this.#recap = start.driver;
    this.#mode = "recap";
  }

  // Dual attestation by declaration (the Phase 25 model): both sides
  // submit the winner with the last verified boundary checksum —
  // identical on both sides by construction. Agreement ends and rates
  // the match; disagreement quarantines it as disputed.
  async attest(winnerSeat: number): Promise<boolean> {
    const finalChecksum = this.#match.moves.at(-1)?.endChecksum;
    if (finalChecksum === undefined) {
      return false;
    }

    try {
      let view: MailboxMatchView;
      if (this.#identityV2Session !== undefined) {
        view = await submitResultWithIdentityV2(
          this.mailboxUrl,
          this.#identityV2Session,
          this.matchId,
          this.localPlayer,
          winnerSeat,
          finalChecksum,
        );
      } else if (this.#keys !== undefined) {
        view = await submitResult(
          this.mailboxUrl,
          this.#keys,
          this.matchId,
          this.localPlayer,
          winnerSeat,
          finalChecksum,
        );
      } else {
        return false;
      }

      this.#apply(view);
      return true;
    } catch {
      return false;
    }
  }

  async #postOutbound(): Promise<void> {
    const move = this.#outboundMove;
    if (move === null || this.#posting) {
      return;
    }

    this.#posting = true;
    try {
      let view: MailboxMatchView;
      if (this.#identityV2Session !== undefined) {
        view = await postMoveWithIdentityV2(
          this.mailboxUrl,
          this.#identityV2Session,
          this.matchId,
          move,
        );
      } else if (this.#keys !== undefined) {
        view = await postMove(this.mailboxUrl, this.#keys, this.matchId, move);
      } else {
        return;
      }
      this.#outboundMove = null;
      if (this.#mode === "posting") {
        this.#mode = "awaiting-move";
      }

      this.#apply(view);
    } catch {
      // Keep the move; poll() retries it. Window play already ended
      // locally, so nothing diverges — the mailbox just hears later.
    } finally {
      this.#posting = false;
    }
  }

  #apply(view: MailboxMatchView): void {
    this.#serviceState = view.state;
    this.#winnerSeat = view.winnerSeat ?? null;
    if (view.state !== "active") {
      if (this.#mode !== "ended") {
        this.#mode = "ended";
        this.#onEnded?.(view);
      }

      return;
    }

    // The next move this side has not applied locally, if the
    // opponent posted it. Own moves re-arrive in the view too; the
    // local match already contains them.
    const nextMove = view.moves[this.#match.moves.length];
    if (
      nextMove !== undefined &&
      nextMove.player !== this.localPlayer &&
      this.#pendingMove === null &&
      (this.#mode === "awaiting-move" || this.#mode === "posting")
    ) {
      this.#pendingMove = nextMove;
      if (this.#mode === "awaiting-move") {
        this.#mode = "move-arrived";
      }
    }
  }
}
