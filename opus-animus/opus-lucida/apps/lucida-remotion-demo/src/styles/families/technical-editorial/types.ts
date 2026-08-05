import type { MotionPolicy, SemanticTone, TextDensity } from "../../core";

export const technicalEditorialVariantIds = [
  "technical-brief",
  "annotated-explainer",
  "data-essay",
  "research-digest",
  "evidence-grid",
] as const;

export type TechnicalEditorialVariantId =
  (typeof technicalEditorialVariantIds)[number];

export type TechnicalEditorialFixtureKey =
  | "normal"
  | "dense"
  | "edge"
  | TechnicalEditorialVariantId;

export type TechnicalEditorialAnnotation = {
  label: string;
  value: string;
  note?: string;
  tone?: SemanticTone;
};

export type TechnicalEditorialMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: SemanticTone;
};

export type TechnicalEditorialDiagramNode = {
  kicker: string;
  label: string;
  detail: string;
  tone?: SemanticTone;
};

export type TechnicalEditorialCodeBlock = {
  filename: string;
  language: string;
  lines: string[];
};

export type TechnicalEditorialStep = {
  index: string;
  label: string;
  detail: string;
};

export type TechnicalEditorialFixture = {
  key: TechnicalEditorialFixtureKey;
  sceneLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: TextDensity;
  motionPolicy?: MotionPolicy;
  annotations: TechnicalEditorialAnnotation[];
  metrics: TechnicalEditorialMetric[];
  diagram: {
    title: string;
    subtitle: string;
    nodes: TechnicalEditorialDiagramNode[];
    connectors: string[];
  };
  code: TechnicalEditorialCodeBlock;
  steps: TechnicalEditorialStep[];
  footer: {
    left: string;
    right: string;
  };
};
