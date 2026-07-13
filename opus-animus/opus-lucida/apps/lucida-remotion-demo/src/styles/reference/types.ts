export type ReferenceFamily =
  | "technical-editorial"
  | "cinematic-type"
  | "dashboard-data"
  | "product-showcase";

export type ReferenceSequence = {
  id: string;
  order: number;
  family: ReferenceFamily;
  component: string;
  sceneKey: string;
  startFrame: number;
  durationInFrames: number;
  startSeconds: number;
  durationSeconds: number;
  role: string;
  narrativeBeat: string;
  continuityBridge: string;
};

export type AllStyleReferenceFixture = {
  schemaVersion: "lucida-all-style-reference/v1";
  compositionId: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  durationSeconds: number;
  dominantFamily: ReferenceFamily;
  familiesUsed: ReferenceFamily[];
  productionSceneComponentsUsed: string[];
  constraints: {
    aspectRatio: string;
    deterministic: boolean;
    networkAssets: boolean;
    renderedMedia: string;
    mp4Generated: boolean;
    registeredInAppRoot: boolean;
    maxVisualFamiliesForShort: number;
    minimumDominantFamilyShare: number;
  };
  sequencePlan: ReferenceSequence[];
  continuityRationale: {
    globalNarrative: string;
    dominantFamilyChoice: string;
    styleSwitchPolicy: string;
    outroReturn: string;
  };
  dominantFamilyEvidence: {
    family: ReferenceFamily;
    sequenceIds: string[];
    totalFrames: number;
    totalSeconds: number;
    shareOfComposition: number;
    isLargestFamilyShare: boolean;
    appearsInOutro: boolean;
    outroSequenceId: string;
  };
};
