import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialDenseFixture: TechnicalEditorialFixture = {
  key: "dense",
  sceneLabel: "Dense",
  eyebrow: "Research Summary / High Density",
  title: "Condense a dense technical recap into one portrait frame without collapsing the reading order",
  summary:
    "Dense mode increases annotation payload, keeps code lines short, and pushes the explanation through disciplined surfaces instead of free-floating paragraphs, so the scene remains scannable under time pressure.",
  density: "dense",
  motionPolicy: "reduce",
  annotations: [
    {
      label: "Audience",
      value: "Engineering review",
      note: "Readers need contracts, not mood boards.",
      tone: "accent",
    },
    {
      label: "Density",
      value: "Body copy capped at three rails",
      note: "Long notes are split between diagram, metrics, and steps.",
      tone: "neutral",
    },
    {
      label: "Fallback",
      value: "Reduced motion by default",
      note: "Opacity-led entry keeps the layout deterministic even in QA environments.",
      tone: "success",
    },
    {
      label: "Guardrail",
      value: "No metric invention",
      note: "Every number is descriptive, not fabricated performance data.",
      tone: "warning",
    },
  ],
  metrics: [
    {
      label: "Panels",
      value: "05",
      detail: "Header, summary, rail, diagram, code",
      tone: "accent",
    },
    {
      label: "Copy",
      value: "414c",
      detail: "Distributed across labeled surfaces instead of one large paragraph",
      tone: "warning",
    },
  ],
  diagram: {
    title: "Technical editorial scenes stay legible by assigning each fact to one lane",
    subtitle:
      "The central panel carries the narrative flow while side surfaces handle evidence, caveats, and implementation fragments.",
    nodes: [
      {
        kicker: "01 / Signal",
        label: "Establish the operating context",
        detail: "Name the system, the decision point, and the reason this frame exists.",
        tone: "accent",
      },
      {
        kicker: "02 / Partition",
        label: "Separate mechanism from commentary",
        detail: "The diagram shows the actual flow. The left rail keeps notes short and inspectable.",
        tone: "neutral",
      },
      {
        kicker: "03 / Verify",
        label: "Preserve artifact truthfulness",
        detail: "Review PNGs and report fields describe exactly what was rendered and tested.",
        tone: "success",
      },
    ],
    connectors: [
      "assign lanes",
      "record outputs",
    ],
  },
  code: {
    filename: "render-report.json",
    language: "json",
    lines: [
      "\"validated\": true,",
      "\"checks\": [\"schema\", \"tsc\", \"preview-frames\"],",
      "\"knownLimitations\": [",
      "  \"Registry placeholder not updated in this ownership slice.\"",
      "]",
    ],
  },
  steps: [
    {
      index: "B1",
      label: "Cap the headline",
      detail: "Dense scenes still need one clear promise before detail begins.",
    },
    {
      index: "B2",
      label: "Use labeled evidence",
      detail: "Annotations, metrics, and code each carry one type of information.",
    },
    {
      index: "B3",
      label: "Leave review breadcrumbs",
      detail: "Every output is discoverable from provenance and artifact manifest paths.",
    },
  ],
  footer: {
    left: "technical-editorial / wave-1 / scene-02",
    right: "dense copy / reduced motion / audit-ready",
  },
};
