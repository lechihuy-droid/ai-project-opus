import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";
import { createProductShowcaseMockup } from "./variant-assets";

export const productShowcaseLaunchSummaryFixture: ProductShowcaseFixture = {
  key: "launch-summary",
  sceneLabel: "Launch summary",
  sceneType: "product-reveal",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "reduce",
  eyebrow: "Product Showcase / Recap",
  productName: "Lucida Outcome Summary",
  title: "Close on the visible product result and the three outcomes it contains",
  subtitle: "The recap remains product-led: the result interface stays on stage while concise markers name the visible outcome categories.",
  primaryAssetId: "outcome-summary",
  assets: [createProductShowcaseMockup({ id: "outcome-summary", label: "Outcome summary", alt: "Original portrait outcome summary UI mockup", orientation: "portrait", accent: "#2E9F5D", title: "Outcome summary", focalPoint: { x: 0.5, y: 0.5 } })],
  features: [
    { label: "Result", title: "Visible summary", detail: "The closing state remains a concrete product interface.", metric: "shown" },
    { label: "Outcome", title: "Three markers", detail: "Short labels recap the interface without a generic CTA panel.", metric: "3 items" },
    { label: "Source", title: "Fixture owned", detail: "The scene uses original local SVG media only.", metric: "local" }
  ],
  caption: "Launch summary: a final product state with three bounded result markers.",
  assetPolicyNote: "The recap preserves embed-only rendering and local fixture provenance."
};
