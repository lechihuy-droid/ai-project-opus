import type { MotionPolicy, TextDensity } from "../../core";

export const timelineDocumentaryVariantIds = [
  "chronology",
  "milestones",
  "case-study",
  "evolution",
  "roadmap",
] as const;

export type TimelineDocumentaryVariantId =
  (typeof timelineDocumentaryVariantIds)[number];

export type TimelineDocumentaryFixtureKey = TimelineDocumentaryVariantId;

export type TimelineDocumentarySceneType = TimelineDocumentaryVariantId;

export type TimelineDocumentaryEvent = {
  id: string;
  date: string;
  era: string;
  title: string;
  detail: string;
  sourceLabel: string;
  sourceType: "archive" | "record" | "oral-history" | "analysis";
  image?: {
    status: "available" | "missing";
    label: string;
    treatment?: "blueprint" | "newsprint" | "contact-sheet";
  };
  emphasis?: "primary" | "secondary";
};

export type TimelineDocumentaryFixture = {
  key: TimelineDocumentaryFixtureKey;
  sceneType: TimelineDocumentarySceneType;
  durationInFrames: number;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  chapter: string;
  title: string;
  summary: string;
  dateRange: string;
  thesis: string;
  footer: string;
  events: TimelineDocumentaryEvent[];
};
