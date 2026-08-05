import { Composition, registerRoot } from "remotion";
import { claimEvidenceFixtures } from "../../../../pipeline/fixtures/styles/claim-evidence";
import { CLAIM_EVIDENCE_COMPOSITION_ID, ClaimEvidencePreview, type ClaimEvidencePreviewProps } from "./ClaimEvidencePreview";

const calculateMetadata = ({ props }: { props: ClaimEvidencePreviewProps }) => ({ width: 1080, height: 1920, fps: 30, durationInFrames: claimEvidenceFixtures[props.sceneKey].motionPolicy === "static" ? 60 : 90 });
const ClaimEvidenceRemotionRoot = () => <Composition id={CLAIM_EVIDENCE_COMPOSITION_ID} component={ClaimEvidencePreview} width={1080} height={1920} fps={30} durationInFrames={90} defaultProps={{ sceneKey: "claim-proof" }} calculateMetadata={calculateMetadata} />;

registerRoot(ClaimEvidenceRemotionRoot);
