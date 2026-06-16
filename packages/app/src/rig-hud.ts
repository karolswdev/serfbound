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

export type RigSequenceEntry = {
  readonly id: string;
  readonly title: string;
  readonly gate?: string;
  readonly covers?: readonly string[];
};

const ICON: Record<RigVerdictStatus, string> = { pass: "✓ pass", fail: "✗ FAIL", skip: "⤼ skip" };

// The hand-back report, built from the shared store + the rig sequence — the
// same markdown the deck exports, so the whole protocol can be run and handed
// back from inside the game. Grouped by gate, one line per covered check.
function buildRigReport(sequence: readonly RigSequenceEntry[]): string {
  const store = readStore();
  const lines = ["# Serfbound device-gate playtest — results (in-game capture)", ""];
  let lastGate = "";
  for (const entry of sequence) {
    const gate = entry.gate ?? "(ungated)";
    if (gate !== lastGate) {
      lines.push(`## ${gate}`);
      lastGate = gate;
    }
    lines.push(`### ${entry.title}  (?rig=${entry.id})`);
    for (const checkId of entry.covers ?? []) {
      const verdict = store[checkId];
      const status = verdict?.status ? ICON[verdict.status] : "— not run";
      const note = verdict?.notes ? `\n      note: ${verdict.notes}` : "";
      lines.push(`- [${checkId}] ${status}${note}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

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
};

function navigateToRig(id: string): void {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  params.set("rig", id);
  globalThis.location.search = params.toString();
}

const VERDICTS: readonly { status: RigVerdictStatus; glyph: string; label: string }[] = [
  { status: "pass", glyph: "✓", label: "Pass" },
  { status: "fail", glyph: "✗", label: "Fail" },
  { status: "skip", glyph: "⤼", label: "Skip" },
];

// A forged button, dressed in the shell's button gump (styles.css .rig-hud__btn).
function hudButton(text: string, enabled: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "rig-hud__btn";
  button.textContent = text;
  button.disabled = !enabled;
  if (enabled) {
    button.addEventListener("click", onClick);
  }
  return button;
}

// Mount the overlay. Returns a disposer that removes it. The styling lives in
// styles.css (.rig-hud*) so the results window wears the same gumps, font, and
// palette as the game (design standard §7.5).
export function mountRigHud(options: RigHudOptions): () => void {
  const { root, rig, sequence } = options;
  const store = readStore();

  const panel = document.createElement("aside");
  panel.className = "rig-hud";
  panel.dataset.testid = "rig-hud";
  panel.dataset.rigId = rig.id;

  const index = sequence.findIndex((entry) => entry.id === rig.id);
  const position = index < 0 ? "" : ` · ${index + 1}/${sequence.length}`;

  const header = document.createElement("div");
  header.className = "rig-hud__head";
  const heading = document.createElement("strong");
  heading.className = "rig-hud__title";
  heading.textContent = rig.title;
  const gate = document.createElement("span");
  gate.className = "rig-hud__gate";
  gate.textContent = `${rig.gate}${position}`;
  header.append(heading, gate);

  const instruction = document.createElement("p");
  instruction.className = "rig-hud__instruction";
  instruction.textContent = rig.instruction;
  const result = document.createElement("p");
  result.className = "rig-hud__result";
  result.textContent = `Pass when: ${rig.result}`;

  panel.append(header, instruction, result);

  // One verdict row per check this rig serves.
  for (const checkId of rig.covers) {
    const row = document.createElement("div");
    row.className = "rig-hud__row";
    row.dataset.check = checkId;

    const label = document.createElement("div");
    label.className = "rig-hud__check";
    label.textContent = `Check ${checkId}`;
    row.append(label);

    const buttons = document.createElement("div");
    buttons.className = "rig-hud__verdicts";
    let selected = store[checkId]?.status ?? null;
    const buttonEls = new Map<RigVerdictStatus, HTMLButtonElement>();
    const paint = () => {
      for (const verdict of VERDICTS) {
        buttonEls.get(verdict.status)!.classList.toggle("is-active", selected === verdict.status);
      }
    };
    for (const verdict of VERDICTS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rig-hud__btn";
      button.dataset.verdict = verdict.status;
      button.textContent = `${verdict.glyph} ${verdict.label}`;
      button.addEventListener("click", () => {
        selected = selected === verdict.status ? null : verdict.status;
        writeVerdict(checkId, { status: selected });
        paint();
      });
      buttonEls.set(verdict.status, button);
      buttons.append(button);
    }
    paint();

    const notes = document.createElement("textarea");
    notes.className = "rig-hud__notes";
    notes.placeholder = "Notes / what you saw (optional)…";
    notes.value = store[checkId]?.notes ?? "";
    notes.dataset.check = checkId;
    notes.addEventListener("input", () => writeVerdict(checkId, { notes: notes.value }));

    row.append(buttons, notes);
    panel.append(row);
  }

  // The hand-back report, exportable from inside the game (collapsed by
  // default) — the in-game HUD is a complete capture surface.
  const reportBox = document.createElement("div");
  reportBox.className = "rig-hud__report";
  reportBox.hidden = true;
  const reportPre = document.createElement("pre");
  reportPre.dataset.testid = "rig-report";
  const reportActions = document.createElement("div");
  reportActions.className = "rig-hud__nav";
  const copyButton = hudButton("⧉ Copy", true, () => {
    const text = reportPre.textContent ?? "";
    void (globalThis.navigator?.clipboard?.writeText(text) ?? Promise.reject()).then(
      () => { copyButton.textContent = "⧉ Copied!"; setTimeout(() => (copyButton.textContent = "⧉ Copy"), 1500); },
      () => { /* clipboard blocked — the text is selectable in the panel */ },
    );
  });
  const downloadButton = hudButton("⤓ Download", true, () => {
    const blob = new Blob([reportPre.textContent ?? ""], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gate-playtest-results.md";
    link.click();
    URL.revokeObjectURL(link.href);
  });
  reportActions.append(copyButton, downloadButton);
  reportBox.append(reportPre, reportActions);

  const nav = document.createElement("div");
  nav.className = "rig-hud__nav";
  const prev = sequence[index - 1];
  const next = sequence[index + 1];
  nav.append(
    hudButton("‹ Prev", prev !== undefined, () => prev && navigateToRig(prev.id)),
    hudButton("Next ›", next !== undefined, () => next && navigateToRig(next.id)),
    hudButton("⤓ Report", true, () => {
      if (!reportBox.hidden) {
        reportBox.hidden = true;
      } else {
        reportPre.textContent = buildRigReport(sequence);
        reportBox.hidden = false;
      }
    }),
  );
  panel.append(nav, reportBox);

  root.append(panel);
  return () => panel.remove();
}
