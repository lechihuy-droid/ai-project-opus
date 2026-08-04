import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataScorecardFixture: DashboardDataFixture = {
  key: "scorecard",
  sceneLabel: "Scorecard",
  sceneType: "operations",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Dashboard Data / Scorecard",
  title: "Move delivery work across owners with queue age, readiness, and explicit next-review windows",
  summary: "The dense handoff view keeps queue pressure in the trend, then uses the operation ledger for concrete ownership rather than a generic delivery status summary.",
  timestampLabel: "Handoff cut / fixture-bound",
  footer: "dashboard-data / draft variant / scorecard",
  contextItems: [{ label: "Scene", value: "Handoff" }, { label: "Motion", value: "Reduced" }, { label: "Rows", value: "4 active" }],
  kpis: {
    title: "Handoff posture",
    subtitle: "Counts and age are fixture-bound review values with no inferred delivery dates.",
    state: "ready",
    metrics: [
      { label: "Ready", value: "06", change: "Owner confirmed", detail: "Six work items meet the supplied handoff condition.", tone: "success", sparkline: [2, 3, 4, 5, 6] },
      { label: "Waiting", value: "04", change: "Dependency named", detail: "Four work items wait on an explicit dependency.", tone: "warning", sparkline: [5, 5, 4, 4, 4] },
      { label: "Aged", value: "02", change: "Over 1 day", detail: "Two queue items exceed the stated age condition.", tone: "danger", sparkline: [0, 1, 1, 2, 2] },
      { label: "Median age", value: "7h", change: "Current cut", detail: "The supplied median age gives context without a forecast.", tone: "accent", sparkline: [4, 5, 6, 7, 7] },
    ],
  },
  chart: {
    title: "Queue movement by handoff checkpoint",
    subtitle: "The chart compares items handed off with items still waiting at each supplied checkpoint.",
    state: "ready",
    yAxisLabels: ["10", "8", "6", "4", "0"],
    series: { primaryLabel: "Handed off", secondaryLabel: "Waiting", primaryTone: "success", secondaryTone: "warning" },
    points: [{ label: "Mon", primary: 3, secondary: 6 }, { label: "Tue", primary: 5, secondary: 5 }, { label: "Wed", primary: 6, secondary: 4 }, { label: "Thu", primary: 8, secondary: 4 }, { label: "Fri", primary: 9, secondary: 4 }],
    footer: "Queue movement is descriptive of the listed checkpoints and does not promise completion.",
  },
  watchlist: {
    title: "Handoff controls",
    subtitle: "The rail gives age and dependency signals their operational meaning.",
    items: [
      { label: "Ready rule", value: "Owner confirmed", detail: "Readiness requires the supplied owner field.", tone: "success" },
      { label: "Age rule", value: "Over 1 day", detail: "The aged count follows the fixture threshold.", tone: "danger" },
      { label: "Dependency", value: "4 waiting", detail: "Waiting work retains its named blocker.", tone: "warning" },
      { label: "Limit", value: "No ETA", detail: "The view does not invent a completion time.", tone: "neutral" },
    ],
  },
  operations: {
    title: "Active handoff ledger",
    subtitle: "The ledger is the primary accountability surface for this dense operational variant.",
    state: "ready",
    columns: { queue: "Work", owner: "Next owner", window: "Review", status: "Status" },
    rows: [
      { queue: "Release checklist", owner: "QA", window: "Today", status: "Ready", detail: "The fixture marks the handoff owner as confirmed.", tone: "success" },
      { queue: "Access request", owner: "Platform", window: "Today", status: "Waiting", detail: "Keep the named dependency visible at handoff.", tone: "warning" },
      { queue: "Incident follow-up", owner: "Operations", window: "Today", status: "Aged", detail: "This row exceeds the stated one-day age condition.", tone: "danger" },
      { queue: "Review notes", owner: "Delivery", window: "Next cut", status: "Queued", detail: "The next owner and review window are already supplied.", tone: "accent" },
    ],
    footer: "A handoff remains reviewable only when its owner, state, and next window stay together.",
  },
};
