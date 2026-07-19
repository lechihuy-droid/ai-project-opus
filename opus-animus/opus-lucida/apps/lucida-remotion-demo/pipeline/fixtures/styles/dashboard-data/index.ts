import { dashboardDataBenchmarkGridFixture } from "./benchmark-grid.fixture";
import { dashboardDataComparisonDashboardFixture } from "./comparison-dashboard.fixture";
import { dashboardDataDenseFixture } from "./dense.fixture";
import { dashboardDataEdgeFixture } from "./edge.fixture";
import { dashboardDataNormalFixture } from "./normal.fixture";
import { dashboardDataOperationsMonitorFixture } from "./operations-monitor.fixture";
import { dashboardDataScorecardFixture } from "./scorecard.fixture";
import { dashboardDataTrendPanelFixture } from "./trend-panel.fixture";

export const dashboardDataFixtures = {
  normal: dashboardDataNormalFixture,
  dense: dashboardDataDenseFixture,
  edge: dashboardDataEdgeFixture,
  "benchmark-grid": dashboardDataBenchmarkGridFixture,
  "operations-monitor": dashboardDataOperationsMonitorFixture,
  "comparison-dashboard": dashboardDataComparisonDashboardFixture,
  "trend-panel": dashboardDataTrendPanelFixture,
  scorecard: dashboardDataScorecardFixture,
};

export type {
  DashboardDataFixture,
  DashboardDataFixtureKey,
  DashboardDataVariantId,
} from "../../../../src/styles/families/dashboard-data";
