import { timelineCaseStudyFixture } from "./case-study.fixture";
import { timelineChronologyFixture } from "./chronology.fixture";
import { timelineEvolutionFixture } from "./evolution.fixture";
import { timelineMilestonesFixture } from "./milestones.fixture";
import { timelineRoadmapFixture } from "./roadmap.fixture";

export const timelineDocumentaryFixtures = {
  "chronology": timelineChronologyFixture,
  "milestones": timelineMilestonesFixture,
  "case-study": timelineCaseStudyFixture,
  "evolution": timelineEvolutionFixture,
  "roadmap": timelineRoadmapFixture,
};
export type { TimelineDocumentaryFixture, TimelineDocumentaryFixtureKey, TimelineDocumentaryVariantId } from "../../../../src/styles/families/timeline-documentary";
