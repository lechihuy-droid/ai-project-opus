import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataNormalFixture: DashboardDataFixture = {
  key: "normal",
  sceneLabel: "Normal",
  sceneType: "kpi",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "full",
  eyebrow: "Wave 2 / Dashboard Data / KPI Snapshot",
  title: "Track family throughput, validation health, and queue pressure in one quiet operational frame",
  summary:
    "The normal fixture leads with four topline counters, keeps one trend panel for recent package movement, and reserves the bottom table for concrete ownership rather than decorative dashboard chrome.",
  timestampLabel: "Refresh window / 2026-07-12 23:10 JST",
  footer: "dashboard-data / normal / live fixture metrics",
  contextItems: [
    {
      label: "Scene type",
      value: "KPI snapshot",
    },
    {
      label: "Guardrail",
      value: "Fixture values only",
    },
    {
      label: "Status",
      value: "Experimental package",
    },
  ],
  kpis: {
    title: "Family health across validated packages",
    subtitle:
      "Each counter is explicit fixture data. The renderer only fits typography and normalizes sparkline height.",
    state: "ready",
    metrics: [
      {
        label: "Experimental packages",
        value: "03",
        change: "2 validated this wave",
        detail:
          "terminal-command-center, technical-editorial, and minimal-education are already packaged.",
        tone: "accent",
        sparkline: [1, 1, 2, 2, 3, 3, 3],
      },
      {
        label: "Portrait review frames",
        value: "09",
        change: "3 per reviewed family",
        detail: "All reviewed frames are rendered at 1080x1920 and checked for nonblank output.",
        tone: "success",
        sparkline: [3, 3, 6, 6, 9, 9, 9],
      },
      {
        label: "Families awaiting build",
        value: "05",
        change: "dashboard-data enters Wave 2",
        detail:
          "dashboard-data, paper-notebook, product-showcase, editorial-collage, and timeline-documentary remain ahead.",
        tone: "warning",
        sparkline: [8, 7, 7, 6, 6, 5, 5],
      },
      {
        label: "Known shared blockers",
        value: "01",
        change: "outside ownership scope",
        detail: "Shared registry availability wiring stays untouched in this task slice.",
        tone: "danger",
        sparkline: [1, 1, 1, 1, 1, 1, 1],
      },
    ],
  },
  chart: {
    title: "Package completions by work pass",
    subtitle:
      "Primary bars count validated families. Secondary bars count rendered preview-frame batches.",
    state: "ready",
    yAxisLabels: ["12", "9", "6", "3", "0"],
    series: {
      primaryLabel: "Validated families",
      secondaryLabel: "Frame batches",
      primaryTone: "accent",
      secondaryTone: "success",
    },
    points: [
      { label: "P1", primary: 1, secondary: 0 },
      { label: "P2", primary: 1, secondary: 3 },
      { label: "P3", primary: 2, secondary: 3 },
      { label: "P4", primary: 2, secondary: 6 },
      { label: "P5", primary: 3, secondary: 9 },
    ],
    footer:
      "Bar height is derived from these point values only. No extra trend number or forecast is synthesized at render time.",
  },
  watchlist: {
    title: "Current watchlist",
    subtitle: "Context notes keep the topline numbers interpretable without introducing extra panels.",
    items: [
      {
        label: "Validator",
        value: "Strict contract",
        detail:
          "Production schema, artifact coverage, and forward-slash path rules must all pass.",
        tone: "success",
      },
      {
        label: "Renderer",
        value: "Dedicated root",
        detail:
          "The family renders through its own Remotion entry and stays inside owned files only.",
        tone: "accent",
      },
      {
        label: "Visual grammar",
        value: "Dense but quiet",
        detail:
          "Dense panels, semantic status colors, and table hierarchy replace decorative chrome.",
        tone: "warning",
      },
      {
        label: "Limit",
        value: "No shared integration edit",
        detail: "Registry and root availability changes remain outside this task boundary.",
        tone: "danger",
      },
    ],
  },
  operations: {
    title: "Operations queue",
    subtitle:
      "The bottom table stays practical: each row names a work item, its owner, the working window, and the current status.",
    state: "ready",
    columns: {
      queue: "Queue",
      owner: "Owner",
      window: "Window",
      status: "Status",
    },
    rows: [
      {
        queue: "dashboard-data renderer",
        owner: "Agent D",
        window: "Wave 2",
        status: "In build",
        detail: "Implement the family renderer, package metadata, fixtures, and review artifacts inside owned paths only.",
        tone: "accent",
      },
      {
        queue: "package validation",
        owner: "Local QA",
        window: "Same pass",
        status: "Ready",
        detail: "Run strict visual-package validation plus TypeScript noEmit against the app workspace.",
        tone: "success",
      },
      {
        queue: "shared registry follow-up",
        owner: "Main agent",
        window: "Post-slice",
        status: "Blocked",
        detail: "Availability wiring is tracked but intentionally not changed in this ownership-constrained task.",
        tone: "warning",
      },
    ],
    footer:
      "Operational UI stays quiet: one panel per responsibility, explicit rules, and no nested cards.",
  },
};
