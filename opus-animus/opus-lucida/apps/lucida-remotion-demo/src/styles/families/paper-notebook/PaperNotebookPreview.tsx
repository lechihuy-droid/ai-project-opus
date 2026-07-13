import { PaperNotebookScene } from "./PaperNotebookScene";
import type { PaperNotebookFixtureKey } from "./types";

export const PAPER_NOTEBOOK_COMPOSITION_ID = "PaperNotebookFamilyReview";

export type PaperNotebookPreviewProps = { sceneKey: PaperNotebookFixtureKey };

export const PaperNotebookPreview = ({ sceneKey }: PaperNotebookPreviewProps) => <PaperNotebookScene sceneKey={sceneKey} />;
