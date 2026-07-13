import { Composition } from "remotion";
import {
  DASHBOARD_DATA_COMPOSITION_ID,
  DashboardDataPreview,
  type DashboardDataPreviewProps,
} from "./DashboardDataPreview";
import { dashboardDataFixtures } from "../../../../pipeline/fixtures/styles/dashboard-data";

const calculateMetadata = ({
  props,
}: {
  props: DashboardDataPreviewProps;
}) => ({
  durationInFrames: dashboardDataFixtures[props.sceneKey].durationInFrames,
  fps: 30,
  width: 1080,
  height: 1920,
});

export const DashboardDataRemotionRoot = () => {
  return (
    <Composition
      id={DASHBOARD_DATA_COMPOSITION_ID}
      component={DashboardDataPreview}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={dashboardDataFixtures.normal.durationInFrames}
      defaultProps={{ sceneKey: "normal" }}
      calculateMetadata={calculateMetadata}
    />
  );
};
