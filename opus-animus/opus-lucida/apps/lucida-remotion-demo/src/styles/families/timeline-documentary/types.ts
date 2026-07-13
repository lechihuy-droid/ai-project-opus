import type { MotionPolicy, TextDensity } from "../../core";

export type TimelineDocumentaryFixtureKey =
  | "milestone"
  | "era-change"
  | "conclusion";

export type TimelineDocumentarySceneType = TimelineDocumentaryFixtureKey;

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
