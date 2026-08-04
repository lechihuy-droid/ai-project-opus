import { Composition, registerRoot } from "remotion";
import { systemArchitectureFixtures } from "../../../../pipeline/fixtures/styles/system-architecture";
import { SYSTEM_ARCHITECTURE_COMPOSITION_ID, SystemArchitecturePreview, type SystemArchitecturePreviewProps } from "./SystemArchitecturePreview";

const calculateMetadata = ({ props }: { props: SystemArchitecturePreviewProps }) => ({
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: systemArchitectureFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90,
});

const SystemArchitectureRemotionRoot = () => (
  <Composition id={SYSTEM_ARCHITECTURE_COMPOSITION_ID} component={SystemArchitecturePreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "layered-stack" }} calculateMetadata={calculateMetadata} />
);

registerRoot(SystemArchitectureRemotionRoot);
