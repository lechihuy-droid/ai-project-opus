const sourceRoot = "src/styles/families";
const fixtureRoot = "pipeline/fixtures/styles";

const reviewRendererRegistryKey = (packageId, variantId) =>
  `${packageId}:${variantId}`;

const sceneKeyInput = (sceneKey) => ({
  kind: "scene-key",
  sceneKey,
});

const sceneFixtureInput = () => ({
  kind: "scene-fixture-json",
  propName: "scene",
});

const makeRecord = ({
  packageId,
  variantId,
  entryPoint,
  compositionId,
  fixtureExtension = ".fixture.ts",
  input = sceneKeyInput(variantId),
}) => {
  const fixturePath = `${fixtureRoot}/${packageId}/${variantId}${fixtureExtension}`;

  return Object.freeze({
    key: reviewRendererRegistryKey(packageId, variantId),
    packageId,
    variantId,
    entryPoint: `${sourceRoot}/${packageId}/${entryPoint}`,
    compositionId,
    fixturePath,
    input: Object.freeze(input),
    frame: 42,
  });
};

const familyRecords = ({
  packageId,
  entryPoint,
  compositionId,
  variantIds,
  fixtureExtension,
  inputForVariant,
}) =>
  variantIds.map((variantId) =>
    makeRecord({
      packageId,
      variantId,
      entryPoint,
      compositionId,
      fixtureExtension,
      input: inputForVariant?.(variantId),
    }),
  );

const records = [
  ...familyRecords({
    packageId: "cinematic-type",
    entryPoint: "renderRoot.tsx",
    compositionId: "CinematicTypeFamilyReview",
    variantIds: ["kinetic-hook", "quote", "chapter-reset", "manifesto", "outro"],
  }),
  ...familyRecords({
    packageId: "claim-evidence",
    entryPoint: "renderRoot.tsx",
    compositionId: "ClaimEvidenceFamilyReview",
    variantIds: [
      "claim-proof",
      "pro-con",
      "benchmark-audit",
      "myth-reality",
      "source-triangulation",
    ],
  }),
  ...familyRecords({
    packageId: "code-walkthrough",
    entryPoint: "renderRoot.tsx",
    compositionId: "CodeWalkthroughFamilyReview",
    variantIds: [
      "code-focus",
      "diff-review",
      "api-sequence",
      "debugging-trace",
      "terminal-code-split",
    ],
  }),
  ...familyRecords({
    packageId: "dashboard-data",
    entryPoint: "render-entry.tsx",
    compositionId: "DashboardDataFamilyReview",
    variantIds: [
      "benchmark-grid",
      "operations-monitor",
      "comparison-dashboard",
      "trend-panel",
      "scorecard",
    ],
  }),
  ...familyRecords({
    packageId: "editorial-collage",
    entryPoint: "render-entry.tsx",
    compositionId: "EditorialCollageFamilyReview",
    variantIds: [
      "source-montage",
      "culture-recap",
      "visual-essay",
      "quote-collage",
      "multi-source-evidence",
    ],
  }),
  ...familyRecords({
    packageId: "interface-walkthrough",
    entryPoint: "renderRoot.tsx",
    compositionId: "InterfaceWalkthroughFamilyReview",
    variantIds: [
      "annotated-screen",
      "step-flow",
      "feature-tour",
      "state-transition",
      "before-after-ui",
    ],
  }),
  ...familyRecords({
    packageId: "minimal-education",
    entryPoint: "render-entry.tsx",
    compositionId: "MinimalEducationFamily",
    variantIds: [
      "single-concept",
      "step-sequence",
      "comparison-cards",
      "checklist",
      "takeaway",
    ],
    fixtureExtension: ".scene.json",
    inputForVariant: sceneFixtureInput,
  }),
  ...familyRecords({
    packageId: "news-rundown",
    entryPoint: "renderRoot.tsx",
    compositionId: "NewsRundownFamilyReview",
    variantIds: [
      "breaking-update",
      "headline-stack",
      "top-stories",
      "bulletin-grid",
      "weekly-roundup",
    ],
  }),
  ...familyRecords({
    packageId: "paper-notebook",
    entryPoint: "render-entry.tsx",
    compositionId: "PaperNotebookFamilyReview",
    variantIds: [
      "research-notes",
      "derivation",
      "annotated-paper",
      "checklist",
      "lab-log",
    ],
  }),
  ...familyRecords({
    packageId: "product-showcase",
    entryPoint: "render-entry.tsx",
    compositionId: "ProductShowcaseFamilyReview",
    variantIds: [
      "product-hero",
      "feature-reveal",
      "before-after",
      "capability-grid",
      "launch-summary",
    ],
  }),
  ...familyRecords({
    packageId: "system-architecture",
    entryPoint: "renderRoot.tsx",
    compositionId: "SystemArchitectureFamilyReview",
    variantIds: [
      "layered-stack",
      "request-flow",
      "agent-graph",
      "data-pipeline",
      "dependency-map",
    ],
    fixtureExtension: ".fixture.json",
  }),
  ...familyRecords({
    packageId: "technical-editorial",
    entryPoint: "renderRoot.tsx",
    compositionId: "TechnicalEditorialFamilyReview",
    variantIds: [
      "technical-brief",
      "annotated-explainer",
      "data-essay",
      "research-digest",
      "evidence-grid",
    ],
  }),
  ...familyRecords({
    packageId: "terminal-command-center",
    entryPoint: "renderRoot.tsx",
    compositionId: "TerminalCommandCenterFamilyReview",
    variantIds: [
      "clean-cli",
      "agent-runtime",
      "system-monitor",
      "cyberdeck",
      "retro-crt",
    ],
  }),
  ...familyRecords({
    packageId: "timeline-documentary",
    entryPoint: "render-entry.tsx",
    compositionId: "TimelineDocumentaryFamilyReview",
    variantIds: [
      "chronology",
      "milestones",
      "case-study",
      "evolution",
      "roadmap",
    ],
  }),
].sort((left, right) => left.key.localeCompare(right.key));

export { reviewRendererRegistryKey };

export const reviewRendererRecords = Object.freeze(records);

export const reviewRendererRegistry = Object.freeze(
  Object.fromEntries(records.map((record) => [record.key, record])),
);

export const resolveReviewRenderer = (packageId, variantId) =>
  reviewRendererRegistry[reviewRendererRegistryKey(packageId, variantId)] ?? null;
