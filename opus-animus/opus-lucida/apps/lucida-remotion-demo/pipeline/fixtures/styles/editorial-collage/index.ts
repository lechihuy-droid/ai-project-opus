import { editorialCollageCultureRecapFixture } from "./culture-recap.fixture";
import { editorialCollageMultiSourceEvidenceFixture } from "./multi-source-evidence.fixture";
import { editorialCollageQuoteCollageFixture } from "./quote-collage.fixture";
import { editorialCollageSourceMontageFixture } from "./source-montage.fixture";
import { editorialCollageVisualEssayFixture } from "./visual-essay.fixture";

export const editorialCollageFixtures = {
  "source-montage": editorialCollageSourceMontageFixture,
  "culture-recap": editorialCollageCultureRecapFixture,
  "visual-essay": editorialCollageVisualEssayFixture,
  "quote-collage": editorialCollageQuoteCollageFixture,
  "multi-source-evidence": editorialCollageMultiSourceEvidenceFixture,
};

export type {
  EditorialCollageFixture,
  EditorialCollageFixtureKey,
} from "../../../../src/styles/families/editorial-collage";
