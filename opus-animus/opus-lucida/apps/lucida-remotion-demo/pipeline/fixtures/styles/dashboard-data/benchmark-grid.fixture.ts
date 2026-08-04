import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataBenchmarkGridFixture: DashboardDataFixture = {
  key: "benchmark-grid",
  sceneLabel: "Benchmark grid",
  sceneType: "chart",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Dashboard Data / Benchmark Grid",
  title: "Review committed and available capacity across the next supplied planning windows",
  summary: "Dense planning data stays in one dominant trend, while the rail and table retain ownership, threshold, and window context.",
  timestampLabel: "Planning window / fixture-bound",
  footer: "dashboard-data / draft variant / benchmark-grid",
  contextItems: [{ label: "Scene", value: "Planning" }, { label: "Motion", value: "Reduced" }, { label: "Horizon", value: "5 windows" }],
  kpis: {
    title: "Capacity posture",
    subtitle: "Counters are supplied review inputs, not a generated staffing forecast.",
    state: "ready",
    metrics: [
      { label: "Committed", value: "72h", change: "Current window", detail: "Hours already assigned in the fixture.", tone: "accent", sparkline: [45, 51, 58, 66, 72] },
      { label: "Available", value: "84h", change: "Current window", detail: "Hours available before the stated threshold.", tone: "success", sparkline: [92, 90, 88, 86, 84] },
      { label: "Buffer", value: "12h", change: "Above floor", detail: "The remaining buffer is displayed as supplied.", tone: "success", sparkline: [18, 16, 15, 13, 12] },
      { label: "At-risk work", value: "02", change: "Needs review", detail: "Two planned work items cross the review condition.", tone: "warning", sparkline: [0, 1, 1, 2, 2] },
    ],
  },
  chart: {
    title: "Committed versus available hours",
    subtitle: "Each planning window compares committed capacity with the supplied available capacity.",
    state: "ready",
    yAxisLabels: ["100", "75", "50", "25", "0"],
    series: { primaryLabel: "Committed", secondaryLabel: "Available", primaryTone: "accent", secondaryTone: "success" },
    points: [{ label: "W1", primary: 48, secondary: 92 }, { label: "W2", primary: 56, secondary: 90 }, { label: "W3", primary: 63, secondary: 88 }, { label: "W4", primary: 68, secondary: 86 }, { label: "W5", primary: 72, secondary: 84 }],
    footer: "The chart visualizes listed planning windows only; it does not extrapolate capacity beyond W5.",
  },
  watchlist: {
    title: "Planning constraints",
    subtitle: "The rail states the limits needed to read the trend responsibly.",
    items: [
      { label: "Floor", value: "10h buffer", detail: "The fixture uses ten hours as its review threshold.", tone: "warning" },
      { label: "Current", value: "12h", detail: "The latest supplied window remains above the threshold.", tone: "success" },
      { label: "Scope", value: "5 windows", detail: "No capacity outside this stated horizon is represented.", tone: "accent" },
      { label: "Limit", value: "No hiring plan", detail: "The frame reports capacity, not a staffing decision.", tone: "neutral" },
    ],
  },
  operations: {
    title: "Capacity follow-up queue",
    subtitle: "Owners and windows turn the at-risk count into inspectable planning work.",
    state: "ready",
    columns: { queue: "Work", owner: "Owner", window: "Window", status: "Status" },
    rows: [
      { queue: "Release review", owner: "Delivery", window: "W4", status: "Watch", detail: "Confirm the listed commitment before the W4 checkpoint.", tone: "warning" },
      { queue: "Support rotation", owner: "Operations", window: "W5", status: "Review", detail: "Inspect available hours against the stated buffer floor.", tone: "accent" },
      { queue: "Planning record", owner: "Planner", window: "W5", status: "Ready", detail: "Keep the five-window boundary visible in the review note.", tone: "success" },
    ],
    footer: "The planning queue records local review work rather than a forecasted outcome.",
  },
};
