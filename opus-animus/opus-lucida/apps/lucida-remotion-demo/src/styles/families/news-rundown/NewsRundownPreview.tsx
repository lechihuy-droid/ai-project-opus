import { NewsRundownScene } from "./NewsRundownScene";
import type { NewsRundownVariantId } from "./types";

export const NEWS_RUNDOWN_COMPOSITION_ID = "NewsRundownFamilyReview";
export type NewsRundownPreviewProps = { sceneKey: NewsRundownVariantId };
export const NewsRundownPreview = ({ sceneKey }: NewsRundownPreviewProps) => <NewsRundownScene sceneKey={sceneKey} />;
