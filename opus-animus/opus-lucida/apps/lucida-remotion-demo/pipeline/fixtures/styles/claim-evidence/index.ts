import { benchmarkAuditFixture } from "./benchmark-audit.fixture";
import { claimProofFixture } from "./claim-proof.fixture";
import { mythRealityFixture } from "./myth-reality.fixture";
import { proConFixture } from "./pro-con.fixture";
import { sourceTriangulationFixture } from "./source-triangulation.fixture";

export const claimEvidenceFixtures = {
  "claim-proof": claimProofFixture,
  "pro-con": proConFixture,
  "benchmark-audit": benchmarkAuditFixture,
  "myth-reality": mythRealityFixture,
  "source-triangulation": sourceTriangulationFixture,
};

export type { ClaimEvidenceFixture, ClaimEvidenceVariantId } from "../../../../src/styles/families/claim-evidence";
