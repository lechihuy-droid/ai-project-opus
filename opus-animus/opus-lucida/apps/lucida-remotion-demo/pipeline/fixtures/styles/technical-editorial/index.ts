import { technicalEditorialDenseFixture } from "./dense.fixture";
import { technicalEditorialEdgeFixture } from "./edge.fixture";
import { technicalEditorialNormalFixture } from "./normal.fixture";

export const technicalEditorialFixtures = {
  normal: technicalEditorialNormalFixture,
  dense: technicalEditorialDenseFixture,
  edge: technicalEditorialEdgeFixture,
};

export type { TechnicalEditorialFixture, TechnicalEditorialFixtureKey } from "../../../../src/styles/families/technical-editorial";
