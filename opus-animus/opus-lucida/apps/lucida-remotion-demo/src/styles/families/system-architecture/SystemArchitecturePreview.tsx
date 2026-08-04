import { SystemArchitectureScene } from "./SystemArchitectureScene";
import type { SystemArchitectureVariantId } from "./types";

export const SYSTEM_ARCHITECTURE_COMPOSITION_ID = "SystemArchitectureFamilyReview";
export type SystemArchitecturePreviewProps = { sceneKey: SystemArchitectureVariantId };

export const SystemArchitecturePreview = ({ sceneKey }: SystemArchitecturePreviewProps) => (
  <SystemArchitectureScene sceneKey={sceneKey} />
);
