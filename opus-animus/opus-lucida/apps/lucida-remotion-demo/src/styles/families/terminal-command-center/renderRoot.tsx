import { Composition, registerRoot } from "remotion";
import { terminalCommandCenterFixtures } from "../../../../pipeline/fixtures/styles/terminal-command-center";
import { TERMINAL_COMMAND_CENTER_COMPOSITION_ID, TerminalCommandCenterPreview, type TerminalCommandCenterPreviewProps } from "./TerminalCommandCenterPreview";

const calculateMetadata = ({ props }: { props: TerminalCommandCenterPreviewProps }) => ({
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: terminalCommandCenterFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90,
});

const TerminalCommandCenterRemotionRoot = () => (
  <Composition id={TERMINAL_COMMAND_CENTER_COMPOSITION_ID} component={TerminalCommandCenterPreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "clean-cli" }} calculateMetadata={calculateMetadata} />
);

registerRoot(TerminalCommandCenterRemotionRoot);
