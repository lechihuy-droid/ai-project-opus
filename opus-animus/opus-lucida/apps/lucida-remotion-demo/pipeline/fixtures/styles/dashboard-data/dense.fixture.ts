import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataDenseFixture: DashboardDataFixture = {
  key: "dense",
  sceneLabel: "Dense",
  sceneType: "chart",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Wave 2 / Dashboard Data / Trend Detail",
  title: "Handle a denser monitoring brief without losing hierarchy between counters, trends, and next actions",
  summary:
    "The dense fixture pushes more trend points and a larger watchlist while keeping the reading order stable: KPIs at the top, one main chart at center-left, supporting notes on the right, and the operational table at the bottom.",
  timestampLabel: "Review cut / 2026-07-12 23:18 JST",
  footer: "dashboard-data / dense / reduced motion",
  contextItems: [
    {
      label: "Scene type",
      value: "Chart detail",
    },
    {
      label: "Motion",
      value: "Reduced",
    },
    {
      label: "Density",
      value: "High but aligned",
    },
  ],
  kpis: {
    title: "Monitoring snapshot for the active package queue",
    subtitle:
      "Dense mode keeps the same panel count, then increases data rows and trend points instead of stacking new cards inside existing panels.",
    state: "ready",
    metrics: [
      {
        label: "Tracked fixtures",
        value: "12",
        change: "3 per family x 4 implemented families",
        detail: "The dashboard view counts terminal-command-center, technical-editorial, minimal-education, and dashboard-data review fixtures.",
        tone: "accent",
        sparkline: [6, 7, 8, 9, 10, 11, 12],
      },
      {
        label: "Strict validations",
        value: "04",
        change: "package roots under review",
        detail: "Each implemented package should pass the production visual-package validator in strict mode.",
        tone: "success",
        sparkline: [1, 2, 2, 3, 3, 4, 4],
      },
      {
        label: "Queued families",
        value: "05",
        change: "unchanged backlog",
        detail: "Wave 2 and Wave 3 families still wait for implementation after the current slice lands.",
        tone: "warning",
        sparkline: [5, 5, 5, 5, 5, 5, 5],
      },
      {
        label: "Open ownership edges",
        value: "02",
        change: "known external surfaces",
        detail: "Registry availability and broader director integration remain outside family ownership boundaries.",
        tone: "danger",
        sparkline: [1, 1, 2, 2, 2, 2, 2],
      },
    ],
  },
  chart: {
    title: "Review-frame throughput across recent execution passes",
    subtitle:
      "The dense chart adds more points but keeps one dominant plot. No secondary micro-card appears inside the panel.",
    state: "ready",
    yAxisLabels: ["18", "12", "9", "6", "0"],
    series: {
      primaryLabel: "Rendered frames",
      secondaryLabel: "Passed checks",
      primaryTone: "accent",
      secondaryTone: "success",
    },
    points: [
      { label: "08", primary: 3, secondary: 2 },
      { label: "09", primary: 3, secondary: 3 },
      { label: "10", primary: 6, secondary: 5 },
      { label: "11", primary: 6, secondary: 6 },
      { label: "12", primary: 9, secondary: 7 },
      { label: "13", primary: 9, secondary: 8 },
      { label: "14", primary: 12, secondary: 9 },
      { label: "15", primary: 12, secondary: 10 },
      { label: "16", primary: 15, secondary: 11 },
      { label: "17", primary: 18, secondary: 12 },
    ],
    footer:
      "Reduced motion lowers travel distance only. The chart still binds every bar to a fixture point and keeps exact ordering from left to right.",
  },
  watchlist: {
    title: "Dense-state operating notes",
    subtitle: "Supporting notes stay in one rail instead of spawning additional inset cards.",
    items: [
      {
        label: "Text fit",
        value: "Bounded",
        detail: "Headline and summary both use shared typography fitting before overflow is allowed.",
        tone: "success",
      },
      {
        label: "Chart load",
        value: "10 points",
        detail: "Point density rises through one main chart, not through competing mini-panels.",
        tone: "accent",
      },
      {
        label: "Operations rows",
        value: "4 tracked",
        detail: "Row height expands before type shrinks too far in the lower table.",
        tone: "warning",
      },
      {
        label: "Output rule",
        value: "Truthful artifacts",
        detail: "Render reports describe only what was actually validated and rendered in this slice.",
        tone: "danger",
      },
    ],
  },
  operations: {
    title: "Follow-up queue for dense dashboards",
    subtitle:
      "Dense scenes verify that the renderer can carry more rows without turning the lower table into a compressed card stack.",
    state: "ready",
    columns: {
      queue: "Queue",
      owner: "Owner",
      window: "Window",
      status: "Status",
    },
    rows: [
      {
        queue: "dense chart fixture review",
        owner: "Agent D",
        window: "This pass",
        status: "Running",
        detail: "Confirm the chart remains legible with 10 plotted points and dual-series bars.",
        tone: "accent",
      },
      {
        queue: "render artifact verification",
        owner: "Local QA",
        window: "After render",
        status: "Pending",
        detail: "Capture actual PNG dimensions, checksums, and nonblank heuristics into the report.",
        tone: "warning",
      },
      {
        queue: "strict package validation",
        owner: "Validator",
        window: "After files settle",
        status: "Queued",
        detail: "The package must pass the production schema with its full experimental metadata set.",
        tone: "success",
      },
      {
        queue: "shared integration note",
        owner: "Main agent",
        window: "Separate scope",
        status: "Deferred",
        detail: "Keep broader registry and director updates visible in reporting without editing those files here.",
        tone: "danger",
      },
    ],
    footer:
      "Dense review proves the family can add information volume while preserving the same quiet operational layout.",
  },
};
