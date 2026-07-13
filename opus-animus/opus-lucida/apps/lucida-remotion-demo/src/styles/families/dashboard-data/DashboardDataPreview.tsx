import { DashboardDataScene } from "./DashboardDataScene";
import type { DashboardDataFixtureKey } from "./types";

export const DASHBOARD_DATA_COMPOSITION_ID = "DashboardDataFamilyReview";

export type DashboardDataPreviewProps = {
  sceneKey: DashboardDataFixtureKey;
};

export const DashboardDataPreview = ({
  sceneKey,
}: DashboardDataPreviewProps) => {
  return <DashboardDataScene sceneKey={sceneKey} />;
};
