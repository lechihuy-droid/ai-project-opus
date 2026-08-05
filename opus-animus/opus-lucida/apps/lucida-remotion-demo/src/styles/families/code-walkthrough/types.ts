import type { MotionPolicy, TextDensity } from "../../core";

export const codeWalkthroughVariantIds = [
  "code-focus",
  "diff-review",
  "api-sequence",
  "debugging-trace",
  "terminal-code-split",
] as const;

export type CodeWalkthroughVariantId =
  (typeof codeWalkthroughVariantIds)[number];

export type CodeLineTone = "context" | "added" | "removed" | "active" | "warning";

export type CodeWalkthroughLine = {
  value: string;
  tone?: CodeLineTone;
  annotation?: string;
};

export type CodeWalkthroughStep = {
  label: string;
  detail: string;
  state?: "ready" | "active" | "blocked";
};

export type CodeWalkthroughFixture = {
  key: CodeWalkthroughVariantId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  file: {
    path: string;
    language: string;
    branch: string;
  };
  code: CodeWalkthroughLine[];
  sideLabel: string;
  sideTitle: string;
  sideDetail: string;
  steps: CodeWalkthroughStep[];
  terminal?: string[];
  caption: string;
};
