import type { TerminalCommandCenterFixture } from "../../../../src/styles/families/terminal-command-center";

export const systemMonitorFixture: TerminalCommandCenterFixture = {
  key: "system-monitor", label: "System Monitor", eyebrow: "Command center / health snapshot", density: "dense", motionPolicy: "full", layout: "monitor",
  title: "Keep runtime health measurable before interpreting the trace",
  summary: "Metric labels remain explicit and the transcript below captures only the state transitions needed for an operational read.",
  path: "~/lucida/monitor", command: "monitor snapshot --window 5m",
  metrics: [{ label: "Queue", value: "02", tone: "accent" }, { label: "Latency", value: "84 ms", tone: "success" }, { label: "Errors", value: "00", tone: "success" }, { label: "Budget", value: "61%", tone: "warning" }],
  lines: [{ text: "worker-01  healthy  12 jobs complete", tone: "success" }, { text: "worker-02  idle     awaiting next batch", tone: "muted" }, { text: "source-gate stable / no approval mutations", tone: "accent" }],
  caption: "Metrics name the operational state; the short trace shows why that state is trustworthy.",
};
