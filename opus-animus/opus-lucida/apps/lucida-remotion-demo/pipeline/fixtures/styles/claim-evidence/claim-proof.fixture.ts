import type { ClaimEvidenceFixture } from "../../../../src/styles/families/claim-evidence";

export const claimProofFixture: ClaimEvidenceFixture = {
  key: "claim-proof", label: "Claim proof", eyebrow: "Claim evidence / proof chain",
  title: "Make the claim, then show the evidence that carries it",
  summary: "One primary claim remains visible while a bounded ledger names each local source and its support direction.",
  density: "balanced", motionPolicy: "reduce", claim: "The release improved median task completion time without increasing reviewer corrections.", claimStatus: "supported",
  evidence: [
    { source: "Run cohort", detail: "Median completion moved from 18 to 13 minutes across matched tasks.", direction: "supports", strength: 84 },
    { source: "Review log", detail: "Correction rate remained within the prior operating range.", direction: "supports", strength: 77 },
    { source: "Scope note", detail: "The sample excludes untriaged exception paths.", direction: "context", strength: 45 },
  ],
  verdict: "Supported for the matched task cohort", confidence: 78, caption: "The conclusion remains bounded to the measured cohort and stated exception path."
};
