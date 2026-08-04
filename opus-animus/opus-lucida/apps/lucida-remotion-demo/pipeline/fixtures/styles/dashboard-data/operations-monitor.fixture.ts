import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataOperationsMonitorFixture: DashboardDataFixture = {
  key: "operations-monitor",
  sceneLabel: "Operations monitor",
  sceneType: "operations",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "static",
  eyebrow: "Dashboard Data / Operations Monitor",
  title: "Triage service alerts with severity, movement, and an accountable response queue",
  summary: "The frame keeps the current alert signal, response work, and review boundary in fixed panels so urgency does not turn into decorative dashboard noise.",
  timestampLabel: "Review window / fixture-bound",
  footer: "dashboard-data / draft variant / operations-monitor",
  contextItems: [{ label: "Scene", value: "Triage" }, { label: "Motion", value: "Static" }, { label: "Evidence", value: "Fixture only" }],
  kpis: {
    title: "Current alert posture",
    subtitle: "Severity counters describe the supplied review state only.",
    state: "ready",
    metrics: [
      { label: "Critical", value: "01", change: "Needs response", detail: "One supplied critical alert remains assigned.", tone: "danger", sparkline: [0, 0, 1, 1, 1] },
      { label: "Warning", value: "03", change: "Stable", detail: "Three warning signals are in the current queue.", tone: "warning", sparkline: [2, 3, 3, 3, 3] },
      { label: "Acknowledged", value: "04", change: "Owner named", detail: "Each acknowledged item has an explicit owner.", tone: "success", sparkline: [1, 2, 3, 4, 4] },
      { label: "Escalation age", value: "18m", change: "Inside window", detail: "The longest supplied age is still inside the stated review window.", tone: "accent", sparkline: [8, 11, 14, 18, 18] },
    ],
  },
  chart: {
    title: "Open alerts by review checkpoint",
    subtitle: "Bars distinguish open alerts from acknowledged alerts at each supplied checkpoint.",
    state: "ready",
    yAxisLabels: ["6", "4", "2", "0"],
    series: { primaryLabel: "Open", secondaryLabel: "Acknowledged", primaryTone: "danger", secondaryTone: "success" },
    points: [{ label: "09:00", primary: 2, secondary: 1 }, { label: "09:15", primary: 4, secondary: 2 }, { label: "09:30", primary: 3, secondary: 3 }, { label: "09:45", primary: 4, secondary: 4 }],
    footer: "Checkpoint values are fixture data, not a projected incident trend.",
  },
  watchlist: {
    title: "Triage signals",
    subtitle: "The rail qualifies urgency before the queue is read.",
    items: [
      { label: "Primary risk", value: "Latency", detail: "The critical alert names latency as its affected signal.", tone: "danger" },
      { label: "Response", value: "Assigned", detail: "The current response work already has a named owner.", tone: "success" },
      { label: "Review", value: "15 minutes", detail: "The next checkpoint is explicit rather than inferred.", tone: "accent" },
      { label: "Limit", value: "No forecast", detail: "The fixture does not claim whether the alert will resolve.", tone: "warning" },
    ],
  },
  operations: {
    title: "Response queue",
    subtitle: "Each row keeps severity, owner, timing, and status visible in one practical ledger.",
    state: "ready",
    columns: { queue: "Alert", owner: "Owner", window: "Review", status: "Status" },
    rows: [
      { queue: "API latency", owner: "On-call", window: "09:45", status: "Escalated", detail: "Investigate the supplied critical latency signal.", tone: "danger" },
      { queue: "Cache saturation", owner: "Platform", window: "10:00", status: "Watching", detail: "Review the warning threshold at the next checkpoint.", tone: "warning" },
      { queue: "Retry spikes", owner: "Delivery", window: "10:00", status: "Assigned", detail: "Keep the acknowledged retry signal under observation.", tone: "success" },
    ],
    footer: "Triage ends with an owned response list, not an implied remediation outcome.",
  },
};
