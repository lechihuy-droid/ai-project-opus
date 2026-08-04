import type { ClaimEvidenceFixture } from "../../../../src/styles/families/claim-evidence";

export const mythRealityFixture: ClaimEvidenceFixture = {
  key: "myth-reality", label: "Myth and reality", eyebrow: "Claim evidence / correction",
  title: "Correct an overbroad claim with the narrower result evidence supports",
  summary: "The red-to-green arrangement makes the correction explicit without burying the limitation in a footnote.",
  density: "balanced", motionPolicy: "reduce", claim: "Every task receives the same measurable improvement.", claimStatus: "rejected",
  counterclaim: "Measured improvement is concentrated in repeatable, well-specified tasks; exceptions need human routing.",
  evidence: [
    { source: "Segment analysis", detail: "Repeatable tasks show a consistent time reduction.", direction: "supports", strength: 81 },
    { source: "Exception review", detail: "Ambiguous inputs retain variable outcomes.", direction: "context", strength: 70 },
  ],
  verdict: "Replace the universal claim with a scoped result", confidence: 82, caption: "The reality statement preserves the gain and the boundary that keeps it true."
};
