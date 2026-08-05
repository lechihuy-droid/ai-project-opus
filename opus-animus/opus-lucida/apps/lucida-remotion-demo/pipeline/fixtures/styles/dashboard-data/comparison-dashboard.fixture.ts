import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataComparisonDashboardFixture: DashboardDataFixture = {
  key: "comparison-dashboard",
  sceneLabel: "Comparison dashboard",
  sceneType: "kpi",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "full",
  eyebrow: "Dashboard Data / Comparison Dashboard",
  title: "Compare two supplied cohorts without collapsing the result into a single headline metric",
  summary: "The comparison keeps adoption, completion, and support load separate so the dual-series trend can be read with its decision context.",
  timestampLabel: "Comparison cut / fixture-bound",
  footer: "dashboard-data / draft variant / comparison-dashboard",
  contextItems: [{ label: "A", value: "Guided" }, { label: "B", value: "Self-serve" }, { label: "Scope", value: "Fixture only" }],
  kpis: {
    title: "Cohort outcome snapshot",
    subtitle: "Values remain labeled by cohort and do not imply statistical significance.",
    state: "ready",
    metrics: [
      { label: "Guided starts", value: "48", change: "Cohort A", detail: "Supplied count for the guided cohort.", tone: "accent", sparkline: [31, 36, 42, 45, 48] },
      { label: "Self-serve starts", value: "57", change: "Cohort B", detail: "Supplied count for the self-serve cohort.", tone: "neutral", sparkline: [35, 41, 48, 52, 57] },
      { label: "Completion gap", value: "+7pp", change: "A over B", detail: "The fixture records a percentage-point difference only.", tone: "success", sparkline: [2, 3, 5, 6, 7] },
      { label: "Support asks", value: "12", change: "Across cohorts", detail: "The count is shown as context, not causal proof.", tone: "warning", sparkline: [4, 6, 8, 10, 12] },
    ],
  },
  chart: {
    title: "Completion rate by supplied checkpoint",
    subtitle: "The two series preserve cohort identity from left to right.",
    state: "ready",
    yAxisLabels: ["100", "75", "50", "25", "0"],
    series: { primaryLabel: "Guided", secondaryLabel: "Self-serve", primaryTone: "accent", secondaryTone: "success" },
    points: [{ label: "Start", primary: 100, secondary: 100 }, { label: "Setup", primary: 82, secondary: 75 }, { label: "First task", primary: 68, secondary: 57 }, { label: "Complete", primary: 54, secondary: 47 }],
    footer: "Only the supplied checkpoints are plotted; no interpolation or conclusion is added.",
  },
  watchlist: {
    title: "Comparison notes",
    subtitle: "The rail keeps the reading boundary explicit.",
    items: [
      { label: "Question", value: "Completion", detail: "The plot answers the narrow completion comparison.", tone: "accent" },
      { label: "Difference", value: "+7pp", detail: "The stated gap is a fixture value, not a recommendation.", tone: "success" },
      { label: "Context", value: "12 asks", detail: "Support volume is kept adjacent to the outcome.", tone: "warning" },
      { label: "Limit", value: "No causality", detail: "The frame does not claim the cohort method caused the gap.", tone: "neutral" },
    ],
  },
  operations: {
    title: "Comparison follow-ups",
    subtitle: "Follow-up rows make the next inspection concrete without turning results into approvals.",
    state: "ready",
    columns: { queue: "Follow-up", owner: "Owner", window: "Window", status: "Status" },
    rows: [
      { queue: "Review completion gap", owner: "Research", window: "Next cut", status: "Ready", detail: "Check the supplied cohort definition before interpretation.", tone: "accent" },
      { queue: "Read support asks", owner: "Support", window: "Next cut", status: "Queued", detail: "Classify the existing asks without joining extra data.", tone: "warning" },
      { queue: "Publish note", owner: "Analyst", window: "After review", status: "Bounded", detail: "State the comparison limit alongside the outcome.", tone: "success" },
    ],
    footer: "Comparison work remains bounded to the values shown in this fixture.",
  },
};
