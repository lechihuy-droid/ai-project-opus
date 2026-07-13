import type { DashboardDataFixture } from "../../../../src/styles/families/dashboard-data";

export const dashboardDataEdgeFixture: DashboardDataFixture = {
  key: "edge",
  sceneLabel: "Edge",
  sceneType: "operations",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "static",
  eyebrow: "Wave 2 / Dashboard Data / Recovery State",
  title: "Show loading, empty, and error handling explicitly when structured data is incomplete or failing",
  summary:
    "The edge fixture keeps the same panel layout but swaps three data panels into non-ready states. This verifies that the renderer surfaces incomplete data honestly instead of fabricating healthy counters or trends.",
  timestampLabel: "Recovery snapshot / 2026-07-12 23:26 JST",
  footer: "dashboard-data / edge / truthful failure states",
  contextItems: [
    {
      label: "Scene type",
      value: "Operations recovery",
    },
    {
      label: "Motion",
      value: "Static",
    },
    {
      label: "Goal",
      value: "No phantom data",
    },
  ],
  kpis: {
    title: "Topline metrics are still syncing",
    subtitle:
      "The panel keeps its structure and labels but does not invent values while the fixture marks the KPI state as loading.",
    state: "loading",
    metrics: [],
    stateMessage: {
      title: "Metrics sync in progress",
      detail:
        "The fixture intentionally omits KPI values here so the renderer must hold the panel with placeholders only.",
      tone: "accent",
      placeholderLabels: [
        "Validated families",
        "Preview frames",
        "Open blockers",
        "Queued follow-ups",
      ],
    },
  },
  chart: {
    title: "No trend sample is available",
    subtitle:
      "Empty-state handling should preserve chart hierarchy without adding fabricated bars or implied history.",
    state: "empty",
    yAxisLabels: ["18", "12", "9", "6", "0"],
    series: {
      primaryLabel: "Rendered frames",
      secondaryLabel: "Passed checks",
      primaryTone: "accent",
      secondaryTone: "success",
    },
    points: [],
    footer:
      "This footer remains textual because the fixture contains no chart points to visualize.",
    stateMessage: {
      title: "Trend panel has no points",
      detail:
        "The current review slice does not provide time-series values for this scene, so the chart stays empty by design.",
      tone: "warning",
      lines: [
        "No placeholder bars are drawn.",
        "Axis labels remain visible so the panel still reads as a chart surface.",
        "The report should note the empty state rather than hiding it.",
      ],
    },
  },
  watchlist: {
    title: "Recovery notes",
    subtitle: "The right rail explains why the scene is degraded and what remains trustworthy.",
    items: [
      {
        label: "Still reliable",
        value: "Layout contract",
        detail: "Panel positions, semantic colors, and text hierarchy remain deterministic even when data is missing.",
        tone: "success",
      },
      {
        label: "Still reliable",
        value: "Ownership scope",
        detail: "The package continues to avoid shared registry and script edits outside the allowed directories.",
        tone: "accent",
      },
      {
        label: "Attention",
        value: "Data feed absent",
        detail: "The missing chart and loading KPIs are deliberate fixture conditions, not renderer-generated numbers.",
        tone: "warning",
      },
      {
        label: "Attention",
        value: "Ops error visible",
        detail: "The table below converts the failure into an auditable artifact instead of a blank screen.",
        tone: "danger",
      },
    ],
  },
  operations: {
    title: "Operational failure report",
    subtitle:
      "The error state turns system trouble into a designed report surface so review artifacts remain truthful and nonblank.",
    state: "error",
    columns: {
      queue: "Queue",
      owner: "Owner",
      window: "Window",
      status: "Status",
    },
    rows: [],
    footer:
      "Failure-state rendering is considered complete only when the package reports the degradation plainly.",
    stateMessage: {
      title: "Queue handshake failed",
      detail:
        "The fixture marks the operations table as error so the renderer must present the issue, not backfill healthy-looking rows.",
      tone: "danger",
      lines: [
        "Collector heartbeat was not received for the current refresh window.",
        "Render queue stays paused until the next successful validation pass.",
        "Artifact reports remain valid because they describe the degraded state exactly as rendered.",
      ],
    },
  },
};
