import {
  IdentityServiceError,
  fetchIdentity,
  registerIdentity,
  generateIdentityKeys,
  type IdentityKeys,
} from "./identity-client.js";
import {
  acceptChallenge,
  acceptChallengeWithIdentityV2,
  createChallenge,
  createChallengeWithIdentityV2,
  fetchLadder,
  listChallenges,
  listMatchesForKey,
  listMatchesForIdentityV2,
  type LadderEntry,
  type MailboxMatchView,
  type MatchTerms,
} from "./mailbox-client.js";
import type { IdentityV2Session } from "./identity-v2-client.js";
import type { StoredProfileAccount } from "./profile-store.js";

// The shell online surface (SB-29-04): device-key sign-in, the
// challenge lobby, and the your-turn badge against the deployed
// backbone. DOM-free by the codebase convention — the shell renders
// `status`. Two postures are non-negotiable: accountless play never
// touches this object, and a dead service degrades it to
// "unavailable" without ever throwing into the shell.

export type OnlineSurfaceStatus = "signed-out" | "signing-in" | "signed-in" | "unavailable";

export type OnlineLobbyEntry = {
  readonly challengeId: string;
  readonly terms: MatchTerms;
  readonly challengerName: string;
  readonly challengerKeyId: string;
};

export class SerfboundOnlineSurface {
  readonly identityUrl: string;
  readonly mailboxUrl: string;
  #status: OnlineSurfaceStatus = "signed-out";
  #keys: IdentityKeys | undefined;
  #identityV2Session: IdentityV2Session | undefined;
  #accountId: string | undefined;
  #accountName: string | undefined;
  #lobby: readonly OnlineLobbyEntry[] = [];
  #myMatches: readonly MailboxMatchView[] = [];
  #ladder: readonly LadderEntry[] = [];
  #lastError: string | null = null;
  #onAccountLinked: ((account: StoredProfileAccount) => void) | undefined;

  constructor(options: {
    identityUrl: string;
    mailboxUrl: string;
    onAccountLinked?: (account: StoredProfileAccount) => void;
  }) {
    this.identityUrl = options.identityUrl;
    this.mailboxUrl = options.mailboxUrl;
    this.#onAccountLinked = options.onAccountLinked;
  }

  get status(): OnlineSurfaceStatus {
    return this.#status;
  }

  get accountId(): string | undefined {
    return this.#accountId;
  }

  get accountName(): string | undefined {
    return this.#accountName;
  }

  get keys(): IdentityKeys | undefined {
    return this.#keys;
  }

  get identityV2Session(): IdentityV2Session | undefined {
    return this.#identityV2Session;
  }

  get authMode(): "signed-out" | "device-key" | "identity-v2" {
    if (this.#identityV2Session !== undefined) {
      return "identity-v2";
    }

    return this.#keys === undefined ? "signed-out" : "device-key";
  }

  get lobby(): readonly OnlineLobbyEntry[] {
    return this.#lobby;
  }

  get lastError(): string | null {
    return this.#lastError;
  }

  // Matches where it is this player's window right now.
  get yourTurnCount(): number {
    if (this.#accountId === undefined) {
      return 0;
    }

    return this.#myMatches.filter(
      (match) => match.state === "active" && match.nextPlayer === match.yourSeat,
    ).length;
  }

  get activeMatches(): readonly MailboxMatchView[] {
    return this.#myMatches.filter((match) => match.state === "active");
  }

  // Quarantined, unrated — visible, never hidden (the Phase 25 model).
  get disputedCount(): number {
    return this.#myMatches.filter((match) => match.state === "disputed").length;
  }

  get ladder(): readonly LadderEntry[] {
    return this.#ladder;
  }

  // The ladder loads on explicit request — an accountless player may
  // read it, but only by asking (the zero-traffic posture holds until
  // the player touches the online surface).
  async loadLadder(): Promise<boolean> {
    try {
      this.#ladder = await fetchLadder(this.mailboxUrl);
      this.#lastError = null;
      return true;
    } catch (error) {
      this.#degrade(error);
      return false;
    }
  }

  // Best-effort rating lookup for lobby cards: the lobby carries
  // names, not keys — a rating shows only when exactly one rated
  // player bears the name (ambiguity shows nothing, honestly).
  ratingForName(name: string): number | undefined {
    const entries = this.#ladder.filter((entry) => entry.name === name);
    return entries.length === 1 ? entries[0]?.rating : undefined;
  }

  ratingForKeyId(keyId: string): number | undefined {
    return this.#ladder.find((entry) => entry.keyId === keyId)?.rating;
  }

  // A previously linked account (from the stored profile) signs back
  // in without any network round-trip — the keypair IS the account.
  restore(account: StoredProfileAccount, name: string): void {
    if (this.#identityV2Session !== undefined) {
      return;
    }

    this.#keys = { publicKeyJwk: account.publicKeyJwk, privateKeyJwk: account.privateKeyJwk };
    this.#accountId = account.accountId;
    this.#accountName = name;
    this.#status = "signed-in";
  }

  // Identity v2 sessions are response-only bearer proofs from the
  // identity service. They unlock the social mailbox without minting a
  // device key or storing one as a v2 credential.
  useIdentityV2Session(session: IdentityV2Session): void {
    this.#identityV2Session = session;
    this.#accountId = session.accountId;
    this.#accountName = session.displayName;
    this.#status = "signed-in";
    this.#lastError = null;
  }

  async signIn(name: string): Promise<boolean> {
    if (this.#status === "signing-in") {
      return false;
    }

    this.#status = "signing-in";
    this.#lastError = null;
    try {
      const keys = this.#keys ?? (await generateIdentityKeys());
      const identity = await registerIdentity(this.identityUrl, keys, name);
      // Adopt the service-sanitized name (game-font alphabet, capped
      // length) so the lobby and the account always agree.
      const fetched = await fetchIdentity(this.identityUrl, identity.accountId);
      this.#keys = keys;
      this.#accountId = identity.accountId;
      this.#accountName = fetched?.name ?? name;
      this.#status = "signed-in";
      this.#onAccountLinked?.({
        accountId: identity.accountId,
        serviceUrl: this.identityUrl,
        publicKeyJwk: keys.publicKeyJwk,
        privateKeyJwk: keys.privateKeyJwk,
      });
      return true;
    } catch (error) {
      this.#degrade(error);
      return false;
    }
  }

  async refresh(): Promise<boolean> {
    try {
      this.#lobby = await listChallenges(this.mailboxUrl);
      if (this.#identityV2Session !== undefined) {
        this.#myMatches = await listMatchesForIdentityV2(this.mailboxUrl, this.#identityV2Session);
      } else if (this.#accountId !== undefined) {
        this.#myMatches = await listMatchesForKey(this.mailboxUrl, this.#accountId);
      }

      // A successful round-trip clears "unavailable" back to the truth.
      this.#status = this.#accountId === undefined ? "signed-out" : "signed-in";
      this.#lastError = null;
      return true;
    } catch (error) {
      this.#degrade(error);
      return false;
    }
  }

  async postChallenge(terms: MatchTerms): Promise<string | null> {
    if (
      this.#identityV2Session === undefined &&
      (this.#keys === undefined || this.#accountName === undefined)
    ) {
      return null;
    }

    try {
      let challengeId: string;
      if (this.#identityV2Session !== undefined) {
        challengeId = await createChallengeWithIdentityV2(
          this.mailboxUrl,
          this.#identityV2Session,
          terms,
        );
      } else if (this.#keys !== undefined && this.#accountName !== undefined) {
        challengeId = await createChallenge(this.mailboxUrl, this.#keys, this.#accountName, terms);
      } else {
        return null;
      }

      await this.refresh();
      return challengeId;
    } catch (error) {
      this.#degrade(error);
      return null;
    }
  }

  async accept(challengeId: string): Promise<MailboxMatchView | null> {
    if (
      this.#identityV2Session === undefined &&
      (this.#keys === undefined || this.#accountName === undefined)
    ) {
      return null;
    }

    try {
      let match: MailboxMatchView;
      if (this.#identityV2Session !== undefined) {
        match = await acceptChallengeWithIdentityV2(
          this.mailboxUrl,
          this.#identityV2Session,
          challengeId,
        );
      } else if (this.#keys !== undefined && this.#accountName !== undefined) {
        match = await acceptChallenge(this.mailboxUrl, this.#keys, this.#accountName, challengeId);
      } else {
        return null;
      }

      await this.refresh();
      return match;
    } catch (error) {
      this.#degrade(error);
      return null;
    }
  }

  // Any failed call lands here: "unavailable" means "the last online
  // action did not reach the service" — visible, recoverable (every
  // action can simply be tried again), and never thrown to the shell.
  // Players who never touch the online surface never see it.
  #degrade(error: unknown): void {
    this.#status = "unavailable";
    this.#lastError =
      error instanceof IdentityServiceError ? error.message : "The online service is unavailable.";
  }
}
