import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";
import { createProductShowcaseMockup } from "./variant-assets";

export const productShowcaseProductHeroFixture: ProductShowcaseFixture = {
  key: "product-hero",
  sceneLabel: "Product hero",
  sceneType: "product-reveal",
  durationInFrames: 180,
  density: "sparse",
  motionPolicy: "full",
  eyebrow: "Product Showcase / Launch",
  productName: "Lucida Release Board",
  title: "Open with the working release surface, not a marketing claim",
  subtitle: "One original product mockup establishes the active launch state before short labels explain the visible workflow.",
  primaryAssetId: "release-board",
  assets: [createProductShowcaseMockup({ id: "release-board", label: "Release board", alt: "Original portrait release board UI mockup", orientation: "portrait", accent: "#0F8F7A", title: "Release board", focalPoint: { x: 0.5, y: 0.46 } })],
  features: [
    { label: "State", title: "Launch-ready view", detail: "The active product screen leads the scene.", metric: "live" },
    { label: "Signal", title: "Product first", detail: "Supporting copy remains below the visible interface.", metric: "9:16" },
    { label: "Asset", title: "Original mockup", detail: "The rendered media is fixture-bound and embeddable.", metric: "local" }
  ],
  caption: "Product hero: a single embeddable product state establishes the opening frame.",
  assetPolicyNote: "Only this embed_asset receives a media source at render time."
};
