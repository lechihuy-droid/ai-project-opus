import type { MotionPolicy, TextDensity } from "../../core";

export const claimEvidenceVariantIds = [
  "claim-proof",
  "pro-con",
  "benchmark-audit",
  "myth-reality",
  "source-triangulation",
] as const;

export type ClaimEvidenceVariantId = (typeof claimEvidenceVariantIds)[number];
export type EvidenceDirection = "supports" | "weakens" | "context";
export type ClaimStatus = "supported" | "mixed" | "rejected" | "pending";

export type EvidenceItem = {
  source: string;
  detail: string;
  direction: EvidenceDirection;
  strength: number;
};

export type BenchmarkItem = {
  label: string;
  observed: string;
  reference: string;
  verdict: "passes" | "misses" | "mixed";
};

export type ClaimEvidenceFixture = {
  key: ClaimEvidenceVariantId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  claim: string;
  claimStatus: ClaimStatus;
  evidence: EvidenceItem[];
  benchmarks?: BenchmarkItem[];
  counterclaim?: string;
  verdict: string;
  confidence: number;
  caption: string;
};
