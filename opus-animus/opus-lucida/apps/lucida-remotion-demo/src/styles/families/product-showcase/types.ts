import type { MediaKind, MotionPolicy, TextDensity } from "../../core";

export type ProductShowcaseFixtureKey = "normal" | "dense" | "edge";

export type ProductShowcaseSceneType =
  | "product-reveal"
  | "feature-focus"
  | "before-after";

export type ProductShowcaseAssetUsage =
  | "embed_asset"
  | "style_reference"
  | "context_only";

export type ProductShowcaseAssetOrientation = "portrait" | "landscape";

export type ProductShowcaseAsset = {
  id: string;
  src?: string;
  kind: MediaKind;
  usage: ProductShowcaseAssetUsage;
  alt: string;
  label: string;
  orientation: ProductShowcaseAssetOrientation;
  focalPoint: {
    x: number;
    y: number;
  };
  missingReason?: string;
};

export type ProductShowcaseFeature = {
  label: string;
  title: string;
  detail: string;
  metric?: string;
};

export type ProductShowcaseComparison = {
  beforeAssetId: string;
  afterAssetId: string;
  beforeLabel: string;
  afterLabel: string;
  note: string;
};

export type ProductShowcaseFixture = {
  key: ProductShowcaseFixtureKey;
  sceneLabel: string;
  sceneType: ProductShowcaseSceneType;
  durationInFrames: number;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  eyebrow: string;
  productName: string;
  title: string;
  subtitle: string;
  primaryAssetId: string;
  assets: ProductShowcaseAsset[];
  features: ProductShowcaseFeature[];
  comparison?: ProductShowcaseComparison;
  caption: string;
  assetPolicyNote: string;
};
