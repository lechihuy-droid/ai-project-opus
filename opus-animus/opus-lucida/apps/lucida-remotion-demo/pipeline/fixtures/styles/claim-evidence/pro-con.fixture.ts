import type { ClaimEvidenceFixture } from "../../../../src/styles/families/claim-evidence";

export const proConFixture: ClaimEvidenceFixture = {
  key: "pro-con", label: "Pro and con", eyebrow: "Claim evidence / competing evidence",
  title: "Put the supporting and weakening evidence on equal footing",
  summary: "The comparison layout prevents one favorable observation from masking a credible counterexample.",
  density: "balanced", motionPolicy: "full", claim: "The automated reviewer can replace the first manual review pass.", claimStatus: "mixed",
  evidence: [
    { source: "Routine changes", detail: "High-confidence findings matched the manual pass on standard changes.", direction: "supports", strength: 72 },
    { source: "Long-tail cases", detail: "Edge-case reasoning still required a human interpretation step.", direction: "weakens", strength: 68 },
    { source: "Escalation sample", detail: "Novel policy questions were consistently routed for review.", direction: "context", strength: 61 },
  ],
  verdict: "Useful first-pass aid, not a replacement", confidence: 58, caption: "The verdict retains the human boundary where the evidence remains mixed."
};
