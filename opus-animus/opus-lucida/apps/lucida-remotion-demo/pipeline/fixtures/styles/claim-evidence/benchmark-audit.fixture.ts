import type { ClaimEvidenceFixture } from "../../../../src/styles/families/claim-evidence";

export const benchmarkAuditFixture: ClaimEvidenceFixture = {
  key: "benchmark-audit", label: "Benchmark audit", eyebrow: "Claim evidence / measurement audit",
  title: "Audit the headline claim against the measures it depends on",
  summary: "A fixed four-column table keeps observed values, reference values, and the resulting judgment inspectable.",
  density: "dense", motionPolicy: "static", claim: "The new workflow is faster and equally reliable.", claimStatus: "mixed",
  evidence: [
    { source: "Timing report", detail: "Speed result clears its defined threshold.", direction: "supports", strength: 86 },
    { source: "Reliability sample", detail: "Exception handling misses the comparable baseline.", direction: "weakens", strength: 64 },
    { source: "Method note", detail: "Metrics use the same task definition across both periods.", direction: "context", strength: 79 },
  ],
  benchmarks: [
    { label: "Median completion", observed: "13 min", reference: "<= 15 min", verdict: "passes" },
    { label: "Reviewer corrections", observed: "8.1%", reference: "<= 7.5%", verdict: "misses" },
    { label: "Escalation coverage", observed: "94%", reference: ">= 92%", verdict: "passes" },
    { label: "Exception sample", observed: "n=18", reference: "n>=30", verdict: "mixed" },
  ],
  verdict: "Performance passes; reliability claim needs qualification", confidence: 63, caption: "The audit separates a real speed gain from an unsupported equivalence claim."
};
