import type { TerminalCommandCenterFixture } from "../../../../src/styles/families/terminal-command-center";

export const agentRuntimeFixture: TerminalCommandCenterFixture = {
  key: "agent-runtime", label: "Agent Runtime", eyebrow: "Command center / runtime ownership", density: "dense", motionPolicy: "reduce", layout: "runtime",
  title: "Expose the agent that owns each step before reading the result",
  summary: "Task rows distinguish active work, queued follow-up, and completed output without treating the runtime as an anonymous black box.",
  path: "~/lucida/agents/runtime", command: "runtime inspect --active",
  lines: [],
  tasks: [{ label: "Coordinator", detail: "Routes the current renderable package check.", state: "active" }, { label: "Validator", detail: "Checks variant schema and local fixture coverage.", state: "active" }, { label: "Renderer", detail: "Reserved for bounded still review when requested.", state: "queued" }, { label: "Source gate", detail: "No approval changes are requested.", state: "complete" }],
  caption: "Named ownership makes runtime state reviewable without turning the scene into a decorative agent graph.",
};
