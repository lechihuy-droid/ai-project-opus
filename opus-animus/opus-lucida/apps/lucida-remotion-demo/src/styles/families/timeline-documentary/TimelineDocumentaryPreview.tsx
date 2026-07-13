import { TimelineDocumentaryScene } from "./TimelineDocumentaryScene";
import type { TimelineDocumentaryFixtureKey } from "./types";

export const TIMELINE_DOCUMENTARY_COMPOSITION_ID = "TimelineDocumentaryFamilyReview";
export type TimelineDocumentaryPreviewProps = { sceneKey: TimelineDocumentaryFixtureKey };
export const TimelineDocumentaryPreview = ({ sceneKey }: TimelineDocumentaryPreviewProps) => <TimelineDocumentaryScene sceneKey={sceneKey} />;
