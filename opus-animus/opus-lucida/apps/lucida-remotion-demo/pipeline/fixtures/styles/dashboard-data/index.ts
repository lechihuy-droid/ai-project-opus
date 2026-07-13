import { dashboardDataDenseFixture } from "./dense.fixture";
import { dashboardDataEdgeFixture } from "./edge.fixture";
import { dashboardDataNormalFixture } from "./normal.fixture";

export const dashboardDataFixtures = {
  normal: dashboardDataNormalFixture,
  dense: dashboardDataDenseFixture,
  edge: dashboardDataEdgeFixture,
};

export type {
  DashboardDataFixture,
  DashboardDataFixtureKey,
} from "../../../../src/styles/families/dashboard-data";
