import type { MotionPolicy, TextDensity } from "../../core";

export type PaperNotebookFixtureKey = "research-notes" | "derivation" | "annotated-paper" | "checklist" | "lab-log";

export type PaperNotebookSceneType = PaperNotebookFixtureKey;

export type NotebookNote = {
  lead: string;
  detail: string;
  emphasis?: string;
};

export type NotebookEquation = {
  label: string;
  expression: string;
  note: string;
};

export type NotebookChecklistItem = {
  label: string;
  detail: string;
  checked: boolean;
};

export type NotebookAnnotation = {
  label: string;
  detail: string;
  tone: "blue" | "red" | "graphite";
};

export type PaperNotebookFixture = {
  key: PaperNotebookFixtureKey;
  sceneType: PaperNotebookSceneType;
  sceneLabel: string;
  durationInFrames: number;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  eyebrow: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  pageLabel: string;
  sectionTitle: string;
  notes: NotebookNote[];
  equations: NotebookEquation[];
  checklist: NotebookChecklistItem[];
  annotations: NotebookAnnotation[];
  footer: string;
};
