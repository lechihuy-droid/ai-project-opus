import type { ClaimEvidenceFixture } from "../../../../src/styles/families/claim-evidence";

export const sourceTriangulationFixture: ClaimEvidenceFixture = {
  key: "source-triangulation", label: "Source triangulation", eyebrow: "Claim evidence / source comparison",
  title: "Triangulate a conclusion across independent kinds of evidence",
  summary: "Three bounded source cards show agreement, disagreement, and context before a verdict is assigned.",
  density: "balanced", motionPolicy: "full", claim: "The reported operating change is sustained rather than a one-week anomaly.", claimStatus: "pending",
  evidence: [
    { source: "Operational metric", detail: "Weekly median remains below the prior baseline for four observed weeks.", direction: "supports", strength: 74 },
    { source: "Reviewer notes", detail: "Reviewers report fewer repeated handoffs on the same task class.", direction: "supports", strength: 66 },
    { source: "Capacity context", detail: "Lower incoming volume may explain part of the observed change.", direction: "context", strength: 52 },
  ],
  verdict: "Promising cross-source agreement; continue observation", confidence: 69, caption: "The conclusion remains provisional because workload context has not yet been controlled."
};
