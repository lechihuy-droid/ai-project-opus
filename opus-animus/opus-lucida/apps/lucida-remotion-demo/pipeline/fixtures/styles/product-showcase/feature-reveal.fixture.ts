import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";
import { createProductShowcaseMockup } from "./variant-assets";

export const productShowcaseFeatureRevealFixture: ProductShowcaseFixture = {
  key: "feature-reveal",
  sceneLabel: "Feature reveal",
  sceneType: "feature-focus",
  durationInFrames: 210,
  density: "balanced",
  motionPolicy: "full",
  eyebrow: "Product Showcase / Mobile",
  productName: "Lucida Review Inbox",
  title: "Keep a mobile review action visible while the feature notes stay compact",
  subtitle: "The portrait product frame carries the interaction state; four annotations identify the bounded behavior around it.",
  primaryAssetId: "review-inbox",
  assets: [createProductShowcaseMockup({ id: "review-inbox", label: "Mobile review inbox", alt: "Original portrait mobile review inbox UI mockup", orientation: "portrait", accent: "#2E9F5D", title: "Review inbox", focalPoint: { x: 0.5, y: 0.48 } })],
  features: [
    { label: "Queue", title: "Focused task", detail: "One item is visible as the current review action.", metric: "1 item" },
    { label: "Context", title: "State stays local", detail: "Labels describe the shown interface, not external claims.", metric: "shown" },
    { label: "Crop", title: "Portrait lock", detail: "Fixture metadata keeps the mobile focal area stable.", metric: "50/48" },
    { label: "Motion", title: "Staggered notes", detail: "Feature labels enter after the product frame is established.", metric: "4 notes" }
  ],
  caption: "Feature reveal: a portrait product state with four compact behavior markers.",
  assetPolicyNote: "The asset remains an original fixture SVG with embed_asset usage."
};
