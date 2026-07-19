import type { CodeWalkthroughFixture } from "../../../../src/styles/families/code-walkthrough";

export const codeFocusFixture: CodeWalkthroughFixture = {
  key: "code-focus", label: "Code focus", eyebrow: "Code walkthrough / single mechanism",
  title: "Keep the decision path readable before explaining the implementation",
  summary: "One focused source panel keeps line geometry stable while a narrow rail names only the review decisions that affect the outcome.",
  density: "balanced", motionPolicy: "full",
  file: { path: "src/pipeline/resolve.ts", language: "ts", branch: "main" },
  code: [
    { value: "export const resolvePlan = (input: Input) => {", tone: "active" },
    { value: "  const facts = normalize(input.events);" },
    { value: "  const eligible = facts.filter(isRenderable);", tone: "active" },
    { value: "  return rank(eligible, input.policy);" },
    { value: "};" },
  ],
  sideLabel: "Reading order", sideTitle: "Show the branch that changes the result", sideDetail: "The rail stays concise so code remains the primary visual artifact.",
  steps: [
    { label: "Input", detail: "Normalize event shape before selection.", state: "ready" },
    { label: "Gate", detail: "Filter only renderable records.", state: "active" },
    { label: "Output", detail: "Rank deterministic candidates.", state: "ready" },
  ],
  caption: "The visible decision is eligibility. Everything else supports that line without competing for attention.",
};
