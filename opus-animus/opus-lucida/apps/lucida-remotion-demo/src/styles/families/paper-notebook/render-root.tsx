import { Composition } from "remotion";
import { paperNotebookFixtures } from "../../../../pipeline/fixtures/styles/paper-notebook";
import { PAPER_NOTEBOOK_COMPOSITION_ID, PaperNotebookPreview, type PaperNotebookPreviewProps } from "./PaperNotebookPreview";

const calculateMetadata = ({ props }: { props: PaperNotebookPreviewProps }) => ({ durationInFrames: paperNotebookFixtures[props.sceneKey].durationInFrames, fps: 30, width: 1080, height: 1920 });

export const PaperNotebookRemotionRoot = () => <Composition id={PAPER_NOTEBOOK_COMPOSITION_ID} component={PaperNotebookPreview} width={1080} height={1920} fps={30} durationInFrames={paperNotebookFixtures.notes.durationInFrames} defaultProps={{ sceneKey: "notes" }} calculateMetadata={calculateMetadata} />;
