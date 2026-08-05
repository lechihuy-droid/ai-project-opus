import { InterfaceWalkthroughScene } from "./InterfaceWalkthroughScene";
import type { InterfaceWalkthroughVariantId } from "./types";

export const INTERFACE_WALKTHROUGH_COMPOSITION_ID = "InterfaceWalkthroughFamilyReview";
export type InterfaceWalkthroughPreviewProps = { sceneKey: InterfaceWalkthroughVariantId };
export const InterfaceWalkthroughPreview = ({ sceneKey }: InterfaceWalkthroughPreviewProps) => <InterfaceWalkthroughScene sceneKey={sceneKey} />;
