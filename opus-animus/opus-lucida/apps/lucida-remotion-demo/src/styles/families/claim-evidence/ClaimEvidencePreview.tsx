import { ClaimEvidenceScene } from "./ClaimEvidenceScene";
import type { ClaimEvidenceVariantId } from "./types";

export const CLAIM_EVIDENCE_COMPOSITION_ID = "ClaimEvidenceFamilyReview";
export type ClaimEvidencePreviewProps = { sceneKey: ClaimEvidenceVariantId };

export const ClaimEvidencePreview = ({ sceneKey }: ClaimEvidencePreviewProps) => (
  <ClaimEvidenceScene sceneKey={sceneKey} />
);
