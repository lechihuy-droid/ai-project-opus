import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataTrendPanelFixture: DashboardDataFixture = {
  key: "trend-panel",
  sceneLabel: "Trend panel",
  sceneType: "chart",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "static",
  eyebrow: "Dashboard Data / Trend Panel",
  title: "Keep service-level health, breach exposure, and owner follow-ups visible in one bounded review frame",
  summary: "The dashboard uses thresholds as context for supplied measurements, then keeps follow-up responsibilities explicit in the bottom ledger.",
  timestampLabel: "SLA review / fixture-bound",
  footer: "dashboard-data / draft variant / trend-panel",
  contextItems: [{ label: "Scene", value: "SLA review" }, { label: "Motion", value: "Static" }, { label: "Target", value: "95%" }],
  kpis: {
    title: "Service-level snapshot",
    subtitle: "The status colors describe the fixture values relative to the stated target.",
    state: "ready",
    metrics: [
      { label: "Within target", value: "96.2%", change: "+1.2pp", detail: "The current supplied rate exceeds the stated target.", tone: "success", sparkline: [94.4, 95.1, 95.8, 96.0, 96.2] },
      { label: "At risk", value: "03", change: "Named queues", detail: "Three queues need the next review checkpoint.", tone: "warning", sparkline: [1, 1, 2, 3, 3] },
      { label: "Breaches", value: "01", change: "Current cut", detail: "One supplied breach remains in the ledger.", tone: "danger", sparkline: [0, 0, 0, 1, 1] },
      { label: "Review cadence", value: "30m", change: "Fixed", detail: "The next review interval is stated by the fixture.", tone: "accent", sparkline: [30, 30, 30, 30, 30] },
    ],
  },
  chart: {
    title: "Target attainment by checkpoint",
    subtitle: "The primary rate is shown beside its fixed 95 percent threshold.",
    state: "ready",
    yAxisLabels: ["100", "95", "90", "85", "80"],
    series: { primaryLabel: "Attainment", secondaryLabel: "Target", primaryTone: "success", secondaryTone: "accent" },
    points: [{ label: "08:00", primary: 94.2, secondary: 95 }, { label: "08:30", primary: 95.1, secondary: 95 }, { label: "09:00", primary: 95.8, secondary: 95 }, { label: "09:30", primary: 96.2, secondary: 95 }],
    footer: "The threshold is intentionally repeated as supplied series data for direct comparison.",
  },
  watchlist: {
    title: "SLA conditions",
    subtitle: "Status is kept traceable to a target, cadence, and next action.",
    items: [
      { label: "Target", value: "95%", detail: "The stated target applies to this review frame only.", tone: "accent" },
      { label: "Latest", value: "96.2%", detail: "The latest fixture value is above target.", tone: "success" },
      { label: "Exposure", value: "3 queues", detail: "At-risk queues remain visible despite current attainment.", tone: "warning" },
      { label: "Breach", value: "1 open", detail: "The ledger retains the single active breach.", tone: "danger" },
    ],
  },
  operations: {
    title: "Service-level follow-ups",
    subtitle: "Rows make the exposure and breach accountable rather than presenting a passive score.",
    state: "ready",
    columns: { queue: "Queue", owner: "Owner", window: "Review", status: "Status" },
    rows: [
      { queue: "Priority support", owner: "Support", window: "10:00", status: "Breach", detail: "Review the supplied breach before the next cadence.", tone: "danger" },
      { queue: "Inbound triage", owner: "Operations", window: "10:00", status: "At risk", detail: "Inspect the queue against the 95 percent target.", tone: "warning" },
      { queue: "Delivery intake", owner: "Delivery", window: "10:30", status: "Watching", detail: "Retain ownership for the next checkpoint.", tone: "accent" },
    ],
    footer: "Target attainment does not suppress the named queues that still need review.",
  },
};
