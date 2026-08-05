import type { TechnicalEditorialFixture } from "../../../../src/styles/families/technical-editorial";

export const technicalEditorialTechnicalBriefFixture: TechnicalEditorialFixture = {
  key: "technical-brief",
  sceneLabel: "Technical brief",
  eyebrow: "Technical Editorial / Brief",
  title: "Pair a concise implementation contract with the system behavior it guarantees",
  summary:
    "The code rail is evidence, not decoration: it names the contract while the central diagram shows the input, validation, and result governed by that contract.",
  density: "balanced",
  motionPolicy: "full",
  annotations: [
    {
      label: "Contract",
      value: "Validate before render",
      note: "The gate is readable as both code and system behavior.",
      tone: "accent",
    },
    {
      label: "Failure",
      value: "Reject malformed input",
      note: "A blocked path is stated instead of silently omitted.",
      tone: "warning",
    },
    {
      label: "Output",
      value: "Render only valid props",
      note: "The output state follows the named condition.",
      tone: "success",
    },
  ],
  metrics: [
    {
      label: "Code lines",
      value: "04",
      detail: "A minimal enforceable contract",
      tone: "accent",
    },
    {
      label: "Gate",
      value: "01",
      detail: "Validation precedes composition selection",
      tone: "success",
    },
  ],
  diagram: {
    title: "The frame connects the contract to the behavior it permits",
    subtitle:
      "Code and diagram use the same reading order so an implementation detail stays tied to its operational consequence.",
    nodes: [
      {
        kicker: "01 / Receive",
        label: "Accept a typed input",
        detail: "The request enters with a declared shape and explicit required fields.",
        tone: "accent",
      },
      {
        kicker: "02 / Guard",
        label: "Validate the rendering contract",
        detail: "Invalid data is stopped before any composition or artifact is selected.",
        tone: "warning",
      },
      {
        kicker: "03 / Render",
        label: "Produce a bounded preview",
        detail: "A valid request resolves to a deterministic renderable state.",
        tone: "success",
      },
    ],
    connectors: ["assert required fields", "select renderable state"],
  },
  code: {
    filename: "render-contract.ts",
    language: "ts",
    lines: [
      "assertValidProps(inputProps);",
      "const composition = selectComposition(inputProps);",
      "const frame = renderStill(composition);",
      "return report(frame);",
    ],
  },
  steps: [
    { index: "C1", label: "Declare input", detail: "Make the accepted data shape visible." },
    { index: "C2", label: "Show the guard", detail: "Connect validation to the blocked path." },
    { index: "C3", label: "Show output", detail: "End with the artifact produced after validation." },
  ],
  footer: {
    left: "technical-editorial / draft variant / technical-brief",
    right: "local fixture / proposed / no source claim",
  },
};
