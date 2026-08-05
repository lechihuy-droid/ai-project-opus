import { annotatedScreenFixture } from "./annotated-screen.fixture";
import { beforeAfterUiFixture } from "./before-after-ui.fixture";
import { featureTourFixture } from "./feature-tour.fixture";
import { stateTransitionFixture } from "./state-transition.fixture";
import { stepFlowFixture } from "./step-flow.fixture";

export const interfaceWalkthroughFixtures = {
  "annotated-screen": annotatedScreenFixture,
  "step-flow": stepFlowFixture,
  "feature-tour": featureTourFixture,
  "before-after-ui": beforeAfterUiFixture,
  "state-transition": stateTransitionFixture,
};
export type { InterfaceWalkthroughFixture, InterfaceWalkthroughVariantId } from "../../../../src/styles/families/interface-walkthrough";
