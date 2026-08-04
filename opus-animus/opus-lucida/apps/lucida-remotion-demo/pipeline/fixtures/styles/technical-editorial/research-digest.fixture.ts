import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialResearchDigestFixture: TechnicalEditorialFixture = {
  key: "research-digest",
  sceneLabel: "Research digest",
  eyebrow: "Technical Editorial / Research Digest",
  title: "Close a technical explanation with the decision, evidence, and follow-up boundary",
  summary:
    "This recap maintains the technical editorial grammar at the end of a sequence by compressing the decision path into a concise conclusion rather than replacing it with generic closing copy.",
  density: "balanced",
  motionPolicy: "reduce",
  annotations: [
    {
      label: "Decision",
      value: "Use the strict grid for inspectable explanations",
      note: "The choice follows the need for visible structure and evidence.",
      tone: "accent",
    },
    {
      label: "Evidence",
      value: "Local fixture and targeted validation",
      note: "The package records what was tested in this ownership slice.",
      tone: "success",
    },
    {
      label: "Boundary",
      value: "Runtime registration remains separate",
      note: "The recap does not imply a global integration change.",
      tone: "warning",
    },
  ],
  metrics: [
    {
      label: "Takeaways",
      value: "03",
      detail: "Decision, evidence, next boundary",
      tone: "accent",
    },
    {
      label: "Status",
      value: "Draft",
      detail: "Proposed local variant; not approved retrieval evidence",
      tone: "neutral",
    },
  ],
  diagram: {
    title: "A useful technical recap ends with the decision path, not a decorative summary",
    subtitle:
      "The final frame preserves the distinction between what is decided, what supports it, and what remains outside the current scope.",
    nodes: [
      {
        kicker: "01 / Decide",
        label: "Choose the explanatory grammar",
        detail: "Select the strict-grid family for a claim that needs inspectable structure.",
        tone: "accent",
      },
      {
        kicker: "02 / Support",
        label: "Point to local technical evidence",
        detail: "Tie the decision to fixtures, schema validation, and renderer behavior.",
        tone: "success",
      },
      {
        kicker: "03 / Boundary",
        label: "Name the next integration decision",
        detail: "Leave global registration and approval for their owning workflow.",
        tone: "warning",
      },
    ],
    connectors: ["ground decision locally", "hand off explicit boundary"],
  },
  code: {
    filename: "research-digest.ts",
    language: "ts",
    lines: [
      "const decision = chooseFamily('technical-editorial');",
      "const evidence = validateLocalFixtures();",
      "return { decision, evidence, status: 'proposed' };",
    ],
  },
  steps: [
    { index: "D1", label: "Restate the decision", detail: "Keep the conclusion operational and specific." },
    { index: "D2", label: "Name the evidence", detail: "Reference the local proof type, not approval." },
    { index: "D3", label: "Expose the boundary", detail: "Hand off unowned integration transparently." },
  ],
  footer: {
    left: "technical-editorial / draft variant / research-digest",
    right: "local fixture / proposed / no source claim",
  },
};
