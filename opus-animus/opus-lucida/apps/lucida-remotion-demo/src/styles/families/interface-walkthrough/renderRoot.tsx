import { Composition, registerRoot } from "remotion";
import { interfaceWalkthroughFixtures } from "../../../../pipeline/fixtures/styles/interface-walkthrough";
import { INTERFACE_WALKTHROUGH_COMPOSITION_ID, InterfaceWalkthroughPreview, type InterfaceWalkthroughPreviewProps } from "./InterfaceWalkthroughPreview";

const calculateMetadata = ({ props }: { props: InterfaceWalkthroughPreviewProps }) => ({ width: 1080, height: 1920, fps: 30, durationInFrames: interfaceWalkthroughFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90 });
const InterfaceWalkthroughRemotionRoot = () => <Composition id={INTERFACE_WALKTHROUGH_COMPOSITION_ID} component={InterfaceWalkthroughPreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "annotated-screen" }} calculateMetadata={calculateMetadata} />;
registerRoot(InterfaceWalkthroughRemotionRoot);
