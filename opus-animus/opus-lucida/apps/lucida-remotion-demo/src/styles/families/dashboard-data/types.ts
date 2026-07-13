import type { MotionPolicy, SemanticTone, TextDensity } from "../../core";

export type DashboardDataFixtureKey = "normal" | "dense" | "edge";

export type DashboardDataSceneType = "kpi" | "chart" | "operations";

export type DashboardDataPanelState = "ready" | "loading" | "empty" | "error";

export type DashboardDataContextItem = {
  label: string;
  value: string;
};

export type DashboardDataStateMessage = {
  title: string;
  detail: string;
  tone?: SemanticTone;
  lines?: string[];
  placeholderLabels?: string[];
};

export type DashboardDataMetric = {
  label: string;
  value: string;
  change: string;
  detail: string;
  tone?: SemanticTone;
  sparkline?: number[];
};

export type DashboardDataChartPoint = {
  label: string;
  primary: number;
  secondary?: number;
};

export type DashboardDataWatchItem = {
  label: string;
  value: string;
  detail: string;
  tone?: SemanticTone;
};

export type DashboardDataOperationRow = {
  queue: string;
  owner: string;
  window: string;
  status: string;
  detail: string;
  tone?: SemanticTone;
};

export type DashboardDataKpiPanel = {
  title: string;
  subtitle: string;
  state: DashboardDataPanelState;
  metrics: DashboardDataMetric[];
  stateMessage?: DashboardDataStateMessage;
};

export type DashboardDataChartPanel = {
  title: string;
  subtitle: string;
  state: DashboardDataPanelState;
  yAxisLabels: string[];
  series: {
    primaryLabel: string;
    secondaryLabel?: string;
    primaryTone?: SemanticTone;
    secondaryTone?: SemanticTone;
  };
  points: DashboardDataChartPoint[];
  footer: string;
  stateMessage?: DashboardDataStateMessage;
};

export type DashboardDataWatchPanel = {
  title: string;
  subtitle: string;
  items: DashboardDataWatchItem[];
};

export type DashboardDataOperationsPanel = {
  title: string;
  subtitle: string;
  state: DashboardDataPanelState;
  columns: {
    queue: string;
    owner: string;
    window: string;
    status: string;
  };
  rows: DashboardDataOperationRow[];
  footer: string;
  stateMessage?: DashboardDataStateMessage;
};

export type DashboardDataFixture = {
  key: DashboardDataFixtureKey;
  sceneLabel: string;
  sceneType: DashboardDataSceneType;
  durationInFrames: number;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  eyebrow: string;
  title: string;
  summary: string;
  timestampLabel: string;
  footer: string;
  contextItems: DashboardDataContextItem[];
  kpis: DashboardDataKpiPanel;
  chart: DashboardDataChartPanel;
  watchlist: DashboardDataWatchPanel;
  operations: DashboardDataOperationsPanel;
};
