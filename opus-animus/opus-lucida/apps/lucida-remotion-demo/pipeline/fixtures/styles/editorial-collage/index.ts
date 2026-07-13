import { editorialCollageDenseFixture } from "./dense.fixture";
import { editorialCollageEdgeFixture } from "./edge.fixture";
import { editorialCollageNormalFixture } from "./normal.fixture";

export const editorialCollageFixtures = {
  normal: editorialCollageNormalFixture,
  dense: editorialCollageDenseFixture,
  edge: editorialCollageEdgeFixture,
};

export type {
  EditorialCollageFixture,
  EditorialCollageFixtureKey,
} from "../../../../src/styles/families/editorial-collage";
