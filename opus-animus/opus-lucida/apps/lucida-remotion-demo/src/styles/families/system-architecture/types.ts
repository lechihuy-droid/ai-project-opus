import type { MotionPolicy, TextDensity } from "../../core";

export const systemArchitectureVariantIds = [
  "layered-stack",
  "request-flow",
  "agent-graph",
  "data-pipeline",
  "dependency-map",
] as const;

export type SystemArchitectureVariantId =
  (typeof systemArchitectureVariantIds)[number];

export type ArchitectureTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type ArchitectureNode = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  tone?: ArchitectureTone;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
  label?: string;
};

export type SystemArchitectureFixture = {
  key: SystemArchitectureVariantId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  caption: string;
};
