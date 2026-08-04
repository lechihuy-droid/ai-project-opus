import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialAnnotatedExplainerFixture: TechnicalEditorialFixture = {
  key: "annotated-explainer",
  sceneLabel: "Annotated explainer",
  eyebrow: "Technical Editorial / Annotated Explanation",
  title: "Turn one technical claim into an inspectable sequence of system states",
  summary:
    "A single central flow explains what changes at each stage while the rails keep evidence, limits, and review signals visible without competing with the mechanism.",
  density: "balanced",
  motionPolicy: "full",
  annotations: [
    {
      label: "Claim",
      value: "One flow, three state changes",
      note: "Each node answers what enters, changes, and exits.",
      tone: "accent",
    },
    {
      label: "Scope",
      value: "Mechanism before commentary",
      note: "The central panel carries the causal reading order.",
      tone: "neutral",
    },
    {
      label: "Review",
      value: "Boundaries remain named",
      note: "Connectors describe the handoff instead of implying it.",
      tone: "success",
    },
  ],
  metrics: [
    {
      label: "States",
      value: "03",
      detail: "Input, transform, output",
      tone: "accent",
    },
    {
      label: "Reading",
      value: "Linear",
      detail: "One explicit connector between each state",
      tone: "success",
    },
  ],
  diagram: {
    title: "The layout keeps the operational mechanism separate from its evidence",
    subtitle:
      "Readers can trace the primary path first, then inspect the concise annotations that qualify it.",
    nodes: [
      {
        kicker: "01 / Input",
        label: "Capture the stated requirement",
        detail:
          "Start with the bounded claim and the data needed to inspect it.",
        tone: "accent",
      },
      {
        kicker: "02 / Transform",
        label: "Apply the visible contract",
        detail:
          "Show the rule that changes the input rather than hiding it in narration.",
        tone: "neutral",
      },
      {
        kicker: "03 / Output",
        label: "Expose the reviewable result",
        detail:
          "End with an artifact or state that can be checked by a reader.",
        tone: "success",
      },
    ],
    connectors: ["apply named rule", "publish inspectable state"],
  },
  code: {
    filename: "annotated-explainer.ts",
    language: "ts",
    lines: [
      "const claim = captureRequirement(input);",
      "const state = applyContract(claim, rules);",
      "return publishForReview(state);",
    ],
  },
  steps: [
    { index: "M1", label: "Name the input", detail: "Keep the starting state concrete." },
    { index: "M2", label: "Show the rule", detail: "Make the transformation inspectable." },
    { index: "M3", label: "State the output", detail: "Leave a checkable result on screen." },
  ],
  footer: {
    left: "technical-editorial / draft variant / annotated-explainer",
    right: "local fixture / proposed / no source claim",
  },
};
