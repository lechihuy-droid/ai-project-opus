import { Composition, registerRoot } from "remotion";
import { codeWalkthroughFixtures } from "../../../../pipeline/fixtures/styles/code-walkthrough";
import { CODE_WALKTHROUGH_COMPOSITION_ID, CodeWalkthroughPreview, type CodeWalkthroughPreviewProps } from "./CodeWalkthroughPreview";

const calculateMetadata = ({ props }: { props: CodeWalkthroughPreviewProps }) => ({
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: codeWalkthroughFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90,
});

const CodeWalkthroughRemotionRoot = () => <Composition id={CODE_WALKTHROUGH_COMPOSITION_ID} component={CodeWalkthroughPreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "code-focus" }} calculateMetadata={calculateMetadata} />;

registerRoot(CodeWalkthroughRemotionRoot);
