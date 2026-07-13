import { Composition } from "remotion";
import { timelineDocumentaryFixtures } from "../../../../pipeline/fixtures/styles/timeline-documentary";
import { TIMELINE_DOCUMENTARY_COMPOSITION_ID, TimelineDocumentaryPreview, type TimelineDocumentaryPreviewProps } from "./TimelineDocumentaryPreview";

const calculateMetadata = ({ props }: { props: TimelineDocumentaryPreviewProps }) => ({ durationInFrames: timelineDocumentaryFixtures[props.sceneKey].durationInFrames, fps: 30, width: 1080, height: 1920 });
export const TimelineDocumentaryRemotionRoot = () => <Composition id={TIMELINE_DOCUMENTARY_COMPOSITION_ID} component={TimelineDocumentaryPreview} width={1080} height={1920} fps={30} durationInFrames={timelineDocumentaryFixtures.milestone.durationInFrames} defaultProps={{ sceneKey: "milestone" }} calculateMetadata={calculateMetadata} />;
