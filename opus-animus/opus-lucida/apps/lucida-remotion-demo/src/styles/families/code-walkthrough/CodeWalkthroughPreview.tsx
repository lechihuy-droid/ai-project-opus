import { CodeWalkthroughScene } from "./CodeWalkthroughScene";
import type { CodeWalkthroughVariantId } from "./types";

export const CODE_WALKTHROUGH_COMPOSITION_ID = "CodeWalkthroughFamilyReview";

export type CodeWalkthroughPreviewProps = { sceneKey: CodeWalkthroughVariantId };

export const CodeWalkthroughPreview = ({ sceneKey }: CodeWalkthroughPreviewProps) => (
  <CodeWalkthroughScene sceneKey={sceneKey} />
);
