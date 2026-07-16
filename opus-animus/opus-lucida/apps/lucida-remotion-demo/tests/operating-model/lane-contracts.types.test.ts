import type {
  VisualFlowV1Config,
  VisualFlowV2AutoConfig,
  VisualFlowV2LockedConfig,
} from "../../pipeline/contracts/visual-input";

const baseMapping: Omit<VisualFlowV1Config["mapping"], "defaultFamily"> = {
  allowedFamilies: ["terminal", "editorial"],
  allowedPresets: ["command"],
  defaultPreset: "command",
  minSceneSeconds: 3,
  maxSceneSeconds: 8,
  maxItemsPerScene: 10,
};

export const validV1Family: VisualFlowV1Config = {
  schemaVersion: "visual-flow/v1",
  projectId: "v1-family",
  fps: 30,
  themeId: "lucida-terminal/v1",
  sources: [{ id: "script", type: "script", family: "terminal" }],
  mapping: { ...baseMapping, defaultFamily: "terminal" },
};

export const validAutoFlow = {
  schemaVersion: "visual-flow/v2",
  run: {
    schemaVersion: "lucida-run/v1",
    runId: "auto-contract",
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  },
  projectId: "auto-contract",
  fps: 30,
  themeId: "lucida-editorial/v1",
  sources: [{ id: "script", type: "script" }],
  mapping: baseMapping,
} satisfies VisualFlowV2AutoConfig;

export const validLockedFlow = {
  schemaVersion: "visual-flow/v2",
  run: {
    schemaVersion: "lucida-run/v1",
    runId: "locked-contract",
    lane: "rapid-visual-pilot",
    styleMode: "locked",
    lockedStyle: {
      family: "terminal",
      lockedBy: "designer@example.test",
      reason: "Evaluate the terminal treatment.",
    },
    publicationStatus: "non_publishable",
    approvalRefs: [],
  },
  projectId: "locked-contract",
  fps: 30,
  themeId: "lucida-terminal/v1",
  sources: [{ id: "script", type: "script", family: "terminal" }],
  mapping: { ...baseMapping, defaultFamily: "terminal" },
} satisfies VisualFlowV2LockedConfig;

export const invalidAutoSourceFamily: VisualFlowV2AutoConfig = {
  ...validAutoFlow,
  sources: [
    {
      id: "script",
      type: "script",
      // @ts-expect-error Auto style cannot carry an implicit source family.
      family: "terminal",
    },
  ],
};

export const invalidAutoDefaultFamily: VisualFlowV2AutoConfig = {
  ...validAutoFlow,
  mapping: {
    ...baseMapping,
    // @ts-expect-error Auto style cannot carry an implicit mapping family.
    defaultFamily: "terminal",
  },
};

export const invalidLockedWithoutStyle: VisualFlowV2LockedConfig = {
  ...validLockedFlow,
  run: {
    ...validLockedFlow.run,
    // @ts-expect-error Locked style requires the lockedStyle audit record.
    lockedStyle: undefined,
  },
};
