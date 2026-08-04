import type { TerminalCommandCenterFixture } from "../../../../src/styles/families/terminal-command-center";

export const retroCrtFixture: TerminalCommandCenterFixture = {
  key: "retro-crt", label: "Retro CRT", eyebrow: "Command center / diagnostic conclusion", density: "balanced", motionPolicy: "reduce", layout: "crt",
  title: "Use the CRT treatment for a readable diagnostic conclusion, not noise",
  summary: "Warm phosphor emphasis and faint scanlines provide a distinct terminal mood while every line stays stable and readable.",
  path: "~/lucida/diagnostics", command: "diagnose package --terminal-command-center",
  lines: [{ text: "package lineage: existing experimental record", tone: "muted" }, { text: "variant count: 5", tone: "accent" }, { text: "source approval: unchanged", tone: "success" }, { text: "next action: targeted validator", tone: "warning" }],
  caption: "Texture stays behind the transcript so the diagnostic conclusion remains the scene's primary evidence.",
};
