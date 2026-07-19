import { breakingUpdateFixture } from "./breaking-update.fixture";
import { bulletinGridFixture } from "./bulletin-grid.fixture";
import { weeklyRoundupFixture } from "./weekly-roundup.fixture";
import { headlineStackFixture } from "./headline-stack.fixture";
import { topStoriesFixture } from "./top-stories.fixture";

export const newsRundownFixtures = {
  "breaking-update": breakingUpdateFixture,
  "headline-stack": headlineStackFixture,
  "top-stories": topStoriesFixture,
  "bulletin-grid": bulletinGridFixture,
  "weekly-roundup": weeklyRoundupFixture,
};

export type { NewsRundownFixture, NewsRundownVariantId } from "../../../../src/styles/families/news-rundown";
