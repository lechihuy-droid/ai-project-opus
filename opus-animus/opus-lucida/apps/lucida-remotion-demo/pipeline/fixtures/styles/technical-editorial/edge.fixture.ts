import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialEdgeFixture: TechnicalEditorialFixture = {
  key: "edge",
  sceneLabel: "Edge",
  eyebrow: "Edge Case / Long Labels",
  title: "Handle long technical labels, compliance notes, and renderer caveats without breaking the grid",
  summary:
    "The edge fixture pressures the family with longer labels, more caveats, and a more explicit limitation note, while still keeping every surface inside the safe area and preserving a clean annotation rhythm.",
  density: "dense",
  motionPolicy: "static",
  annotations: [
    {
      label: "Edge input",
      value: "Long-form operational naming",
      note: "Examples include checksum registries, artifact provenance chains, and validator compatibility notes.",
      tone: "accent",
    },
    {
      label: "Constraint",
      value: "Ownership excludes shared registry updates",
      note: "Package and renderer are implemented, but shared availability wiring remains outside this task boundary.",
      tone: "warning",
    },
    {
      label: "Result",
      value: "Renderable and auditable package",
      note: "Frames, metadata, fixtures, and report can still be reviewed as a production candidate.",
      tone: "success",
    },
  ],
  metrics: [
    {
      label: "Longest label",
      value: "29ch",
      detail: "Typography scales down before overflow occurs",
      tone: "accent",
    },
    {
      label: "Motion",
      value: "Static",
      detail: "Used to verify reduced-motion readability and deterministic layout",
      tone: "neutral",
    },
  ],
  diagram: {
    title: "Edge handling keeps the composition honest instead of hiding constraints",
    subtitle:
      "This scene turns limitation text into a designed artifact rather than leaving it as an omitted detail.",
    nodes: [
      {
        kicker: "01 / Limit",
        label: "Document the blocked shared surface",
        detail: "State exactly which integration step is outside ownership instead of silently implying completion.",
        tone: "warning",
      },
      {
        kicker: "02 / Adapt",
        label: "Render through a dedicated family entry point",
        detail: "A local Remotion root allows review-frame generation without touching unrelated compositions.",
        tone: "accent",
      },
      {
        kicker: "03 / Deliver",
        label: "Publish review artifacts with provenance",
        detail: "Package validators and TypeScript checks still provide objective evidence for this slice of work.",
        tone: "success",
      },
    ],
    connectors: [
      "scope around blocker",
      "report truthfully",
    ],
  },
  code: {
    filename: "technical-editorial.entry.tsx",
    language: "tsx",
    lines: [
      "bundle({ entryPoint: 'src/styles/families/technical-editorial/renderRoot.tsx' });",
      "const composition = await selectComposition({ serveUrl, id: 'TechnicalEditorialFamilyReview' });",
      "await renderStill({ composition, frame: 24, inputProps: { sceneKey: 'edge' } });",
    ],
  },
  steps: [
    {
      index: "C1",
      label: "Expose the constraint",
      detail: "Call out ownership boundaries before claiming full integration.",
    },
    {
      index: "C2",
      label: "Keep layout deterministic",
      detail: "Static motion mode ensures edge-case screenshots are directly reviewable.",
    },
    {
      index: "C3",
      label: "Ship package evidence",
      detail: "Validator output, render report, and frames are enough for package-level review.",
    },
  ],
  footer: {
    left: "technical-editorial / wave-1 / scene-03",
    right: "edge case / static motion / truthful limitation",
  },
};
