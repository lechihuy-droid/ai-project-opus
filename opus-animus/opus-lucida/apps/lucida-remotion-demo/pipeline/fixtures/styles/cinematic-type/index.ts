import { cinematicTypeChapterResetFixture } from "./chapter-reset.fixture";
import { cinematicTypeKineticHookFixture } from "./kinetic-hook.fixture";
import { cinematicTypeManifestoFixture } from "./manifesto.fixture";
import { cinematicTypeOutroFixture } from "./outro.fixture";
import { cinematicTypeQuoteFixture } from "./quote.fixture";

export const cinematicTypeFixtures = {
  "kinetic-hook": cinematicTypeKineticHookFixture,
  quote: cinematicTypeQuoteFixture,
  "chapter-reset": cinematicTypeChapterResetFixture,
  manifesto: cinematicTypeManifestoFixture,
  outro: cinematicTypeOutroFixture,
};

export type {
  CinematicTypeFixture,
  CinematicTypeFixtureKey,
} from "../../../../src/styles/families/cinematic-type";
