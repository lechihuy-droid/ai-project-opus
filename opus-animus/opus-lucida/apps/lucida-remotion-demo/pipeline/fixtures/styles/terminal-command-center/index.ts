import { agentRuntimeFixture } from "./agent-runtime.fixture";
import { cleanCliFixture } from "./clean-cli.fixture";
import { cyberdeckFixture } from "./cyberdeck.fixture";
import { retroCrtFixture } from "./retro-crt.fixture";
import { systemMonitorFixture } from "./system-monitor.fixture";

export const terminalCommandCenterFixtures = {
  "clean-cli": cleanCliFixture,
  "agent-runtime": agentRuntimeFixture,
  "system-monitor": systemMonitorFixture,
  "cyberdeck": cyberdeckFixture,
  "retro-crt": retroCrtFixture,
};

export type { TerminalCommandCenterFixture, TerminalCommandCenterVariantId } from "../../../../src/styles/families/terminal-command-center";
