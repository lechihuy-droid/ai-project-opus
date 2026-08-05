import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialDataEssayFixture: TechnicalEditorialFixture = {
  key: "data-essay",
  sceneLabel: "Data essay",
  eyebrow: "Technical Editorial / Data Essay",
  title: "Make operational risks visible with owners, guardrails, and an honest residual state",
  summary:
    "A static review-oriented frame separates the risk statement from its mitigation and residual limitation, preserving an auditable reading order under dense technical copy.",
  density: "dense",
  motionPolicy: "static",
  annotations: [
    {
      label: "Risk",
      value: "Unbounded copy can break review frames",
      note: "Long labels need constrained typography and fixed safe areas.",
      tone: "warning",
    },
    {
      label: "Guardrail",
      value: "Fit text before layout",
      note: "The renderer resolves type against known surface dimensions.",
      tone: "accent",
    },
    {
      label: "Residual",
      value: "Human visual review remains required",
      note: "A nonblank image check does not prove semantic quality.",
      tone: "neutral",
    },
  ],
  metrics: [
    {
      label: "Risk level",
      value: "Med",
      detail: "Dense copy increases layout review pressure",
      tone: "warning",
    },
    {
      label: "Motion",
      value: "Static",
      detail: "Designed for deterministic inspection",
      tone: "neutral",
    },
  ],
  diagram: {
    title: "Risk review is clearer when each mitigation preserves the original constraint",
    subtitle:
      "The flow records the identified risk, the local control, and the part that remains outside automatic proof.",
    nodes: [
      {
        kicker: "01 / Identify",
        label: "Expose the layout risk",
        detail: "State the condition that can reduce readability or invalidate a frame.",
        tone: "warning",
      },
      {
        kicker: "02 / Control",
        label: "Apply a deterministic guardrail",
        detail: "Use fixed surfaces and text fitting before rendering the still.",
        tone: "accent",
      },
      {
        kicker: "03 / Residual",
        label: "Record the remaining review need",
        detail: "Keep human visual judgment distinct from machine checks.",
        tone: "neutral",
      },
    ],
    connectors: ["apply local control", "retain review requirement"],
  },
  code: {
    filename: "data-essay.ts",
    language: "ts",
    lines: [
      "const risk = detectOverflow(copy, surface);",
      "const control = fitTypographyToBox(copy, surface);",
      "return { risk, control, residual: 'visual review' };",
    ],
  },
  steps: [
    { index: "R1", label: "Name the risk", detail: "Avoid broad or decorative warning language." },
    { index: "R2", label: "State the guardrail", detail: "Make the local control inspectable." },
    { index: "R3", label: "Keep the residual", detail: "Do not claim automation proves visual quality." },
  ],
  footer: {
    left: "technical-editorial / draft variant / data-essay",
    right: "local fixture / proposed / no source claim",
  },
};
