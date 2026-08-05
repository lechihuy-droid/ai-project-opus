import type { MediaKind, MotionPolicy, SemanticTone, TextDensity } from "../../core";

export const editorialCollageVariantIds = [
  "source-montage",
  "culture-recap",
  "visual-essay",
  "quote-collage",
  "multi-source-evidence",
] as const;

export type EditorialCollageFixtureKey =
  (typeof editorialCollageVariantIds)[number];

export type EditorialCollageSceneType = EditorialCollageFixtureKey;

export type EditorialCollageAssetClassification =
  | "embed_asset"
  | "style_reference"
  | "context_only";

export type EditorialCollageCrop = {
  xPercent: number;
  yPercent: number;
  zoom: number;
};

export type EditorialCollageAsset = {
  id: string;
  label: string;
  kind: MediaKind;
  classification: EditorialCollageAssetClassification;
  src?: string;
  alt: string;
  crop: EditorialCollageCrop;
  sourceNote: string;
  tone?: SemanticTone;
};

export type EditorialCollageCaption = {
  kicker: string;
  text: string;
  sourceLabel: string;
};

export type EditorialCollageLayer = {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  zIndex: number;
  tone?: SemanticTone;
  caption: EditorialCollageCaption;
};

export type EditorialCollageCallout = {
  label: string;
  detail: string;
  tone: SemanticTone;
};

export type EditorialCollageFixture = {
  key: EditorialCollageFixtureKey;
  sceneType: EditorialCollageSceneType;
  sceneLabel: string;
  durationInFrames: number;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  eyebrow: string;
  title: string;
  subtitle: string;
  deck: string;
  assets: EditorialCollageAsset[];
  layers: EditorialCollageLayer[];
  callouts: EditorialCollageCallout[];
  recap: string[];
  footer: {
    left: string;
    right: string;
  };
};
