import type { TerminalCommandCenterFixture } from "../../../../src/styles/families/terminal-command-center";

export const cyberdeckFixture: TerminalCommandCenterFixture = {
  key: "cyberdeck", label: "Cyberdeck", eyebrow: "Command center / launch surface", density: "dense", motionPolicy: "full", layout: "deck",
  title: "Give the launch command one focal panel and attach only essential modules",
  summary: "The deck stays operational: a command initiates work while a narrow rail names its evidence, guard, and next action.",
  path: "~/lucida/terra/e1", command: "validate terminal-command-center --targeted",
  lines: [{ text: "read manifest -> 5 variants", tone: "accent" }, { text: "assert fixture map -> complete", tone: "success" }, { text: "preserve provenance -> locked", tone: "warning" }],
  tasks: [{ label: "Evidence", detail: "Existing source record remains untouched.", state: "complete" }, { label: "Variants", detail: "Five named draft layouts are present.", state: "active" }, { label: "Render", detail: "Deferred by the current bounded task.", state: "queued" }],
  caption: "The cyberdeck treatment remains a compact work surface, not an imitation security interface.",
};
