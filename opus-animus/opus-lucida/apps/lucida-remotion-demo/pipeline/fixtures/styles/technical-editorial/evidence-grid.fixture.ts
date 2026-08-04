import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialEvidenceGridFixture: TechnicalEditorialFixture = {
  key: "evidence-grid",
  sceneLabel: "Evidence grid",
  eyebrow: "Technical Editorial / Evidence Grid",
  title: "Keep claims, checks, and limitations in separate evidence lanes",
  summary:
    "This dense review frame organizes technical evidence as labeled records so a conclusion stays traceable to the check that supports it and the limitation that qualifies it.",
  density: "dense",
  motionPolicy: "reduce",
  annotations: [
    {
      label: "Claim",
      value: "The render path is deterministic",
      note: "The result is compared against a repeated local render.",
      tone: "accent",
    },
    {
      label: "Check",
      value: "Hash and frame dimensions",
      note: "Machine-readable checks remain adjacent to the conclusion.",
      tone: "success",
    },
    {
      label: "Limit",
      value: "Review scope is package-local",
      note: "No shared runtime registration is implied by this fixture.",
      tone: "warning",
    },
  ],
  metrics: [
    {
      label: "Records",
      value: "03",
      detail: "Claim, check, limitation",
      tone: "accent",
    },
    {
      label: "Motion",
      value: "Reduced",
      detail: "Stable reading order for review capture",
      tone: "neutral",
    },
  ],
  diagram: {
    title: "An evidence ledger prevents a visual conclusion from outrunning its proof",
    subtitle:
      "Each stage keeps an explicit relation between the observation, the check, and the bounded interpretation.",
    nodes: [
      {
        kicker: "01 / Observe",
        label: "Record the rendered state",
        detail: "Identify the artifact and the exact frame selected for review.",
        tone: "accent",
      },
      {
        kicker: "02 / Check",
        label: "Run a bounded verification",
        detail: "Use dimensions and repeat output as local technical evidence.",
        tone: "success",
      },
      {
        kicker: "03 / Qualify",
        label: "State the remaining limit",
        detail: "Keep untested integration or source status visible in the record.",
        tone: "warning",
      },
    ],
    connectors: ["attach local check", "record qualified result"],
  },
  code: {
    filename: "evidence-grid.json",
    language: "json",
    lines: [
      '"claim": "deterministic local frame",',
      '"checks": ["sha256", "dimensions"],',
      '"limitation": "shared registry excluded"',
    ],
  },
  steps: [
    { index: "E1", label: "State the claim", detail: "Use a bounded, testable statement." },
    { index: "E2", label: "Attach the check", detail: "Keep the proof type explicit." },
    { index: "E3", label: "Keep the limit", detail: "Do not promote local proof to global approval." },
  ],
  footer: {
    left: "technical-editorial / draft variant / evidence-grid",
    right: "local fixture / proposed / no source claim",
  },
};
