// The in-game verification HUD (SB-44-03). When the app boots with `?rig=`,
// this overlay rides on top of the three.js canvas carrying the gate check's
// instruction and a Pass/Fail/Skip + notes control for every check the rig
// serves. The maintainer performs the one gesture under test and records the
// verdict right here — no tab-switching. Verdicts persist to the SAME
// localStorage key the playtest deck reads ("serfbound-gate-playtest-v1"), so
// the deck/report reflect in-game captures immediately (game + deck are
// same-origin). Everything in this module is inert unless `?rig=` is present.

export type RigVerdictStatus = "pass" | "fail" | "skip";

type StoredVerdict = { status: RigVerdictStatus | null; notes: string };
type VerdictStore = Record<string, StoredVerdict>;

// Shared with the deck (playtest/index.html STORE_KEY) — keep in lockstep.
const STORE_KEY = "serfbound-gate-playtest-v1";

function readStore(): VerdictStore {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) ?? "null") as unknown;
    if (raw === null || typeof raw !== "object") {
      return {};
    }
    return raw as VerdictStore;
  } catch {
    return {};
  }
}

function writeVerdict(checkId: string, patch: Partial<StoredVerdict>): void {
  const store = readStore();
  const current = store[checkId] ?? { status: null, notes: "" };
  store[checkId] = { ...current, ...patch };
  try {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Private-mode / storage-disabled: the HUD still works in-session.
  }
}

export type RigSequenceEntry = { readonly id: string; readonly title: string };

export type RigHudOptions = {
  readonly root: HTMLElement;
  readonly rig: {
    readonly id: string;
    readonly gate: string;
    readonly title: string;
    readonly instruction: string;
    readonly result: string;
    readonly covers: readonly string[];
  };
  readonly sequence: readonly RigSequenceEntry[];
  readonly deckHref?: string;
};

function navigateToRig(id: string): void {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  params.set("rig", id);
  globalThis.location.search = params.toString();
}

const VERDICTS: readonly { status: RigVerdictStatus; glyph: string; label: string; color: string }[] = [
  { status: "pass", glyph: "✓", label: "Pass", color: "#4caf50" },
  { status: "fail", glyph: "✗", label: "Fail", color: "#e5534b" },
  { status: "skip", glyph: "⤼", label: "Skip", color: "#b0883a" },
];

// Mount the overlay. Returns a disposer that removes it.
export function mountRigHud(options: RigHudOptions): () => void {
  const { root, rig, sequence } = options;
  const store = readStore();

  const panel = document.createElement("aside");
  panel.dataset.testid = "rig-hud";
  panel.dataset.rigId = rig.id;
  panel.setAttribute(
    "style",
    [
      "position:fixed",
      "left:50%",
      "transform:translateX(-50%)",
      "bottom:12px",
      "z-index:2147483000",
      "width:min(560px, calc(100vw - 24px))",
      "max-height:46vh",
      "overflow:auto",
      "box-sizing:border-box",
      "padding:12px 14px",
      "border-radius:14px",
      "border:2px solid #3a4654",
      "background:rgba(18,22,26,0.96)",
      "color:#e8edf2",
      "font:13px/1.4 system-ui,sans-serif",
      "box-shadow:0 8px 28px rgba(0,0,0,0.5)",
    ].join(";"),
  );

  const index = sequence.findIndex((entry) => entry.id === rig.id);
  const position = index < 0 ? "" : ` · ${index + 1}/${sequence.length}`;

  const header = document.createElement("div");
  header.setAttribute("style", "display:flex;justify-content:space-between;align-items:baseline;gap:8px");
  const heading = document.createElement("strong");
  heading.textContent = rig.title;
  heading.setAttribute("style", "font-size:15px");
  const gate = document.createElement("span");
  gate.textContent = `${rig.gate}${position}`;
  gate.setAttribute("style", "font-size:11px;color:#8aa0b4;white-space:nowrap");
  header.append(heading, gate);

  const instruction = document.createElement("p");
  instruction.textContent = rig.instruction;
  instruction.setAttribute("style", "margin:8px 0 4px;font-weight:600");
  const result = document.createElement("p");
  result.textContent = `Pass when: ${rig.result}`;
  result.setAttribute("style", "margin:0 0 8px;color:#9fb3c4;font-size:12px");

  panel.append(header, instruction, result);

  // One verdict row per check this rig serves.
  for (const checkId of rig.covers) {
    const row = document.createElement("div");
    row.dataset.check = checkId;
    row.setAttribute("style", "margin:8px 0;padding-top:8px;border-top:1px solid #2a323c");

    const label = document.createElement("div");
    label.textContent = `Check ${checkId}`;
    label.setAttribute("style", "font-size:11px;color:#8aa0b4;margin-bottom:4px");
    row.append(label);

    const buttons = document.createElement("div");
    buttons.setAttribute("style", "display:flex;gap:6px;flex-wrap:wrap");
    const stored = store[checkId]?.status ?? null;
    const buttonEls = new Map<RigVerdictStatus, HTMLButtonElement>();
    for (const verdict of VERDICTS) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.verdict = verdict.status;
      button.textContent = `${verdict.glyph} ${verdict.label}`;
      const active = stored === verdict.status;
      button.setAttribute(
        "style",
        [
          "flex:1",
          "min-width:84px",
          "padding:7px 6px",
          "border-radius:9px",
          "cursor:pointer",
          "font:600 12px system-ui,sans-serif",
          `border:2px solid ${active ? verdict.color : "#3a4654"}`,
          `background:${active ? verdict.color : "transparent"}`,
          `color:${active ? "#0b0e11" : "#cdd8e2"}`,
        ].join(";"),
      );
      buttonEls.set(verdict.status, button);
      buttons.append(button);
    }

    const notes = document.createElement("textarea");
    notes.placeholder = "Notes / what you saw (optional)…";
    notes.value = store[checkId]?.notes ?? "";
    notes.dataset.check = checkId;
    notes.setAttribute(
      "style",
      "width:100%;box-sizing:border-box;margin-top:6px;min-height:34px;padding:6px;border-radius:8px;border:1px solid #2a323c;background:#0f1318;color:#e8edf2;font:12px system-ui,sans-serif;resize:vertical",
    );
    notes.addEventListener("input", () => writeVerdict(checkId, { notes: notes.value }));

    let selected = stored;
    for (const verdict of VERDICTS) {
      const button = buttonEls.get(verdict.status)!;
      button.addEventListener("click", () => {
        selected = selected === verdict.status ? null : verdict.status;
        writeVerdict(checkId, { status: selected });
        for (const other of VERDICTS) {
          const el = buttonEls.get(other.status)!;
          const active = selected === other.status;
          el.style.border = `2px solid ${active ? other.color : "#3a4654"}`;
          el.style.background = active ? other.color : "transparent";
          el.style.color = active ? "#0b0e11" : "#cdd8e2";
        }
      });
    }

    row.append(buttons, notes);
    panel.append(row);
  }

  // Navigation: walk the rig sequence, or jump back to the deck.
  const nav = document.createElement("div");
  nav.setAttribute("style", "display:flex;gap:6px;margin-top:10px");
  const navButton = (text: string, enabled: boolean, onClick: () => void): HTMLButtonElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.disabled = !enabled;
    button.setAttribute(
      "style",
      [
        "flex:1",
        "padding:8px",
        "border-radius:9px",
        "border:2px solid #3a4654",
        "background:transparent",
        `color:${enabled ? "#cdd8e2" : "#566472"}`,
        `cursor:${enabled ? "pointer" : "default"}`,
        "font:600 12px system-ui,sans-serif",
      ].join(";"),
    );
    if (enabled) {
      button.addEventListener("click", onClick);
    }
    return button;
  };

  const prev = sequence[index - 1];
  const next = sequence[index + 1];
  nav.append(
    navButton("‹ Prev", prev !== undefined, () => prev && navigateToRig(prev.id)),
    navButton("Next ›", next !== undefined, () => next && navigateToRig(next.id)),
  );
  if (options.deckHref !== undefined) {
    const deck = document.createElement("a");
    deck.href = options.deckHref;
    deck.textContent = "Deck";
    deck.setAttribute(
      "style",
      "flex:1;text-align:center;padding:8px;border-radius:9px;border:2px solid #3a4654;color:#cdd8e2;text-decoration:none;font:600 12px system-ui,sans-serif",
    );
    nav.append(deck);
  }
  panel.append(nav);

  root.append(panel);
  return () => panel.remove();
}
