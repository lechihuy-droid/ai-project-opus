import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";
import { createProductShowcaseMockup } from "./variant-assets";

export const productShowcaseCapabilityGridFixture: ProductShowcaseFixture = {
  key: "capability-grid",
  sceneLabel: "Capability grid",
  sceneType: "feature-focus",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Product Showcase / Desktop",
  productName: "Lucida Package Console",
  title: "Tour one desktop control surface with a deterministic landscape crop",
  subtitle: "The interface remains central while four short markers identify the controls visible inside the original desktop mockup.",
  primaryAssetId: "package-console",
  assets: [createProductShowcaseMockup({ id: "package-console", label: "Package console", alt: "Original landscape package console UI mockup", orientation: "landscape", accent: "#0F8F7A", title: "Package console", focalPoint: { x: 0.55, y: 0.45 } })],
  features: [
    { label: "Rail", title: "Scoped navigation", detail: "The left rail remains inside the product interface.", metric: "local" },
    { label: "Panel", title: "Focused state", detail: "The center surface holds the active inspection context.", metric: "focus" },
    { label: "Crop", title: "Landscape lock", detail: "The portrait stage uses the fixture focal point consistently.", metric: "55/45" },
    { label: "Notes", title: "Bounded labels", detail: "Annotations explain visible controls without extra panels.", metric: "4 notes" }
  ],
  caption: "Capability grid: one landscape product screen with a controlled crop and compact markers.",
  assetPolicyNote: "This local mockup is the only embeddable source selected for the stage."
};
