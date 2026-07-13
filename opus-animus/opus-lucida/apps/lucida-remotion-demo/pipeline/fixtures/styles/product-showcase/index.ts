import { productShowcaseDenseFixture } from "./dense.fixture";
import { productShowcaseEdgeFixture } from "./edge.fixture";
import { productShowcaseNormalFixture } from "./normal.fixture";

export const productShowcaseFixtures = {
  normal: productShowcaseNormalFixture,
  dense: productShowcaseDenseFixture,
  edge: productShowcaseEdgeFixture,
};

export type {
  ProductShowcaseFixture,
  ProductShowcaseFixtureKey,
} from "../../../../src/styles/families/product-showcase";
