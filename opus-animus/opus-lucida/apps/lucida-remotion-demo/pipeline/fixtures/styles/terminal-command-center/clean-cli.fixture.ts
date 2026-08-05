import type { TerminalCommandCenterFixture } from "../../../../src/styles/families/terminal-command-center";

export const cleanCliFixture: TerminalCommandCenterFixture = {
  key: "clean-cli", label: "Clean CLI", eyebrow: "Command center / concise command", density: "balanced", motionPolicy: "full", layout: "cli",
  title: "Show the command, then the result it makes inspectable",
  summary: "A single terminal surface gives the command a stable reading order without visual noise or extra status modules.",
  path: "~/lucida/release-check", command: "npm run verify -- --scope terminal",
  lines: [{ text: "validate variants: 5 expected / 5 found", tone: "accent" }, { text: "fixtures: deterministic names resolved", tone: "success" }, { text: "status: ready for targeted validation", tone: "success" }],
  caption: "Keep the evidence short: one command, a few named checks, and an explicit result.",
};
