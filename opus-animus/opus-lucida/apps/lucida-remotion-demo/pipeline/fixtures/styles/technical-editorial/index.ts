import { technicalEditorialAnnotatedExplainerFixture } from "./annotated-explainer.fixture";
import { technicalEditorialDataEssayFixture } from "./data-essay.fixture";
import { technicalEditorialDenseFixture } from "./dense.fixture";
import { technicalEditorialEdgeFixture } from "./edge.fixture";
import { technicalEditorialEvidenceGridFixture } from "./evidence-grid.fixture";
import { technicalEditorialNormalFixture } from "./normal.fixture";
import { technicalEditorialResearchDigestFixture } from "./research-digest.fixture";
import { technicalEditorialTechnicalBriefFixture } from "./technical-brief.fixture";

export const technicalEditorialFixtures = {
  normal: technicalEditorialNormalFixture,
  dense: technicalEditorialDenseFixture,
  edge: technicalEditorialEdgeFixture,
  "technical-brief": technicalEditorialTechnicalBriefFixture,
  "annotated-explainer": technicalEditorialAnnotatedExplainerFixture,
  "data-essay": technicalEditorialDataEssayFixture,
  "research-digest": technicalEditorialResearchDigestFixture,
  "evidence-grid": technicalEditorialEvidenceGridFixture,
};

export type {
  TechnicalEditorialFixture,
  TechnicalEditorialFixtureKey,
  TechnicalEditorialVariantId,
} from "../../../../src/styles/families/technical-editorial";
