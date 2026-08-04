import checklistScene from "./checklist.scene.json";
import comparisonCardsScene from "./comparison-cards.scene.json";
import singleConceptScene from "./single-concept.scene.json";
import stepSequenceScene from "./step-sequence.scene.json";
import takeawayScene from "./takeaway.scene.json";
import type {
  MinimalEducationScene,
  MinimalEducationVariantId,
} from "../../../../src/styles/families/minimal-education/types";

export const minimalEducationVariantFixtures: Record<
  MinimalEducationVariantId,
  MinimalEducationScene
> = {
  "single-concept": singleConceptScene as MinimalEducationScene,
  "step-sequence": stepSequenceScene as MinimalEducationScene,
  "comparison-cards": comparisonCardsScene as MinimalEducationScene,
  "checklist": checklistScene as MinimalEducationScene,
  "takeaway": takeawayScene as MinimalEducationScene,
};
