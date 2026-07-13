import { cinematicTypeHookFixture } from "./hook.fixture";
import { cinematicTypeQuoteFixture } from "./quote.fixture";
import { cinematicTypeTransitionFixture } from "./transition.fixture";

export const cinematicTypeFixtures = {
  hook: cinematicTypeHookFixture,
  quote: cinematicTypeQuoteFixture,
  transition: cinematicTypeTransitionFixture,
};

export type {
  CinematicTypeFixture,
  CinematicTypeFixtureKey,
} from "../../../../src/styles/families/cinematic-type";
