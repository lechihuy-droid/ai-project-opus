import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialNormalFixture: TechnicalEditorialFixture = {
  key: "normal",
  sceneLabel: "Normal",
  eyebrow: "System Architecture / Explainer",
  title: "Map a retrieval pipeline into visible stages, contracts, and review gates",
  summary:
    "The frame uses one dominant grid, a central diagram, and narrow evidence rails so viewers can inspect both the overall flow and the exact operational notes without losing hierarchy.",
  density: "balanced",
  motionPolicy: "full",
  annotations: [
    {
      label: "Objective",
      value: "Explain retrieval flow",
      note: "Keep stage names explicit and label each contract boundary.",
      tone: "accent",
    },
    {
      label: "Constraint",
      value: "No copied UI or branding",
      note: "All chrome, rules, and markers are original Lucida primitives.",
      tone: "warning",
    },
    {
      label: "Review",
      value: "QA stays inside safe area",
      note: "Annotations remain readable above caption and platform overlays.",
      tone: "success",
    },
  ],
  metrics: [
    {
      label: "Stages",
      value: "03",
      detail: "Ingest, normalize, present",
      tone: "accent",
    },
    {
      label: "Risk",
      value: "Low",
      detail: "Deterministic copy and no external media dependency",
      tone: "success",
    },
  ],
  diagram: {
    title: "Evidence moves through a fixed technical reading order",
    subtitle:
      "Each node states what enters, what changes, and what becomes inspectable in the next panel.",
    nodes: [
      {
        kicker: "01 / Input",
        label: "Collect reference evidence",
        detail: "Research notes, schema rules, and fixture content are reduced to the concepts that actually matter on-screen.",
        tone: "accent",
      },
      {
        kicker: "02 / Transform",
        label: "Resolve grid and annotation contract",
        detail: "Shared layout, typography, and motion primitives shape the frame before any family-specific decoration appears.",
        tone: "neutral",
      },
      {
        kicker: "03 / Output",
        label: "Render still review artifacts",
        detail: "Preview PNGs and a machine-readable report prove that the family can be reviewed without a bespoke playback tool.",
        tone: "success",
      },
    ],
    connectors: [
      "normalize source",
      "render + verify",
    ],
  },
  code: {
    filename: "technical-editorial.render.tsx",
    language: "tsx",
    lines: [
      "const layout = resolveVerticalLayout({ platform: 'tiktok' });",
      "const columns = resolveColumns(layout.content, 12, tokens.grid.gutter);",
      "const diagram = spanColumns(columns, 3, 6);",
      "renderStill({ composition, inputProps: { sceneKey: 'normal' } });",
    ],
  },
  steps: [
    {
      index: "A1",
      label: "Frame the claim",
      detail: "Lead with one sentence that tells the viewer what system they are inspecting.",
    },
    {
      index: "A2",
      label: "Show the structure",
      detail: "Place the flow in the center and keep commentary in the side rails.",
    },
    {
      index: "A3",
      label: "Attach evidence",
      detail: "Use code and metric surfaces only for details that reinforce the main diagram.",
    },
  ],
  footer: {
    left: "technical-editorial / wave-1 / scene-01",
    right: "strict grid / annotations / code callouts",
  },
};
