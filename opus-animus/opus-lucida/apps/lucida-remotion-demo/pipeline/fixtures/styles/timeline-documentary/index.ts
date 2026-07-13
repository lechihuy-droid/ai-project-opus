import { timelineConclusionFixture } from "./conclusion.fixture";
import { timelineEraChangeFixture } from "./era-change.fixture";
import { timelineMilestoneFixture } from "./milestone.fixture";

export const timelineDocumentaryFixtures = { milestone: timelineMilestoneFixture, "era-change": timelineEraChangeFixture, conclusion: timelineConclusionFixture };
export type { TimelineDocumentaryFixture, TimelineDocumentaryFixtureKey } from "../../../../src/styles/families/timeline-documentary";
