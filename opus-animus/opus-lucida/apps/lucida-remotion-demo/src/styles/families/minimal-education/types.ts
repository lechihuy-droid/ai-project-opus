import type { MotionPolicy, TextDensity } from "../../core";

export type MinimalEducationAccentTone = "blue" | "teal" | "gold" | "coral";

export const minimalEducationVariantIds = [
  "single-concept",
  "step-sequence",
  "comparison-cards",
  "checklist",
  "takeaway",
] as const;

export type MinimalEducationVariantId =
  (typeof minimalEducationVariantIds)[number];

export type MinimalEducationBaseScene = {
  sceneId: string;
  sceneType: "definition" | "steps" | "comparison";
  durationInFrames: number;
  motionPolicy: MotionPolicy;
  density: TextDensity;
  accentTone: MinimalEducationAccentTone;
  eyebrow: string;
  title: string;
  summary: string;
  footer: string;
  callout?: {
    label: string;
    value: string;
  };
};

export type MinimalEducationDefinitionScene = MinimalEducationBaseScene & {
  sceneType: "definition";
  definition: {
    term: string;
    phonetic: string;
    meaning: string;
    keyPoints: {
      label: string;
      detail: string;
    }[];
  };
};

export type MinimalEducationStepsScene = MinimalEducationBaseScene & {
  sceneType: "steps";
  steps: {
    headline: string;
    items: {
      index: string;
      title: string;
      detail: string;
      state: "ready" | "active";
    }[];
  };
};

export type MinimalEducationComparisonScene = MinimalEducationBaseScene & {
  sceneType: "comparison";
  comparison: {
    leftTitle: string;
    rightTitle: string;
    criteria: {
      label: string;
      leftValue: string;
      rightValue: string;
      emphasis: "left" | "right" | "both" | "neutral";
    }[];
  };
};

export type MinimalEducationScene =
  | MinimalEducationDefinitionScene
  | MinimalEducationStepsScene
  | MinimalEducationComparisonScene;

export type MinimalEducationCompositionProps = {
  scene: MinimalEducationScene;
};
