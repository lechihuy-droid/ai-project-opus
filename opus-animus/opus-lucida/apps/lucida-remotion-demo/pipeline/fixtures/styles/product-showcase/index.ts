import { productShowcaseDenseFixture } from "./dense.fixture";
import { productShowcaseBeforeAfterFixture } from "./before-after.fixture";
import { productShowcaseCapabilityGridFixture } from "./capability-grid.fixture";
import { productShowcaseEdgeFixture } from "./edge.fixture";
import { productShowcaseFeatureRevealFixture } from "./feature-reveal.fixture";
import { productShowcaseLaunchSummaryFixture } from "./launch-summary.fixture";
import { productShowcaseNormalFixture } from "./normal.fixture";
import { productShowcaseProductHeroFixture } from "./product-hero.fixture";

export const productShowcaseFixtures = {
  normal: productShowcaseNormalFixture,
  dense: productShowcaseDenseFixture,
  edge: productShowcaseEdgeFixture,
  "product-hero": productShowcaseProductHeroFixture,
  "feature-reveal": productShowcaseFeatureRevealFixture,
  "before-after": productShowcaseBeforeAfterFixture,
  "capability-grid": productShowcaseCapabilityGridFixture,
  "launch-summary": productShowcaseLaunchSummaryFixture,
};

export type {
  ProductShowcaseFixture,
  ProductShowcaseFixtureKey,
  ProductShowcaseVariantId,
} from "../../../../src/styles/families/product-showcase";
