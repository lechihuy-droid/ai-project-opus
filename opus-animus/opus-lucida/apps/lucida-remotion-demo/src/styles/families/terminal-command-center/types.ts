import type { MotionPolicy, TextDensity } from "../../core";

export const terminalCommandCenterVariantIds = [
  "clean-cli",
  "agent-runtime",
  "system-monitor",
  "cyberdeck",
  "retro-crt",
] as const;

export type TerminalCommandCenterVariantId =
  (typeof terminalCommandCenterVariantIds)[number];

export type TerminalTone = "muted" | "accent" | "success" | "warning" | "danger";

export type TerminalLine = {
  text: string;
  tone?: TerminalTone;
};

export type TerminalTask = {
  label: string;
  detail: string;
  state: "queued" | "active" | "complete" | "blocked";
};

export type TerminalMetric = {
  label: string;
  value: string;
  tone?: TerminalTone;
};

export type TerminalCommandCenterFixture = {
  key: TerminalCommandCenterVariantId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  layout: "cli" | "runtime" | "monitor" | "deck" | "crt";
  path: string;
  command: string;
  lines: TerminalLine[];
  tasks?: TerminalTask[];
  metrics?: TerminalMetric[];
  caption: string;
};
