import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";
import { createProductShowcaseMockup } from "./variant-assets";

export const productShowcaseBeforeAfterFixture: ProductShowcaseFixture = {
  key: "before-after",
  sceneLabel: "Before after",
  sceneType: "before-after",
  durationInFrames: 210,
  density: "balanced",
  motionPolicy: "reduce",
  eyebrow: "Product Showcase / Compare",
  productName: "Lucida Approval Flow",
  title: "Compare two visible product states without substituting reference media",
  subtitle: "Both sides are original embeddable mockups, so the transition stays explicit and reviewable in the rendered scene.",
  primaryAssetId: "flow-after",
  assets: [
    createProductShowcaseMockup({ id: "flow-before", label: "Manual handoff", alt: "Original portrait manual handoff UI mockup", orientation: "portrait", accent: "#C58A1B", title: "Manual handoff", focalPoint: { x: 0.5, y: 0.52 } }),
    createProductShowcaseMockup({ id: "flow-after", label: "Guided handoff", alt: "Original portrait guided handoff UI mockup", orientation: "portrait", accent: "#0F8F7A", title: "Guided handoff", focalPoint: { x: 0.5, y: 0.5 } })
  ],
  features: [
    { label: "Before", title: "Manual state", detail: "The first screen exposes the prior handoff state.", metric: "visible" },
    { label: "After", title: "Guided state", detail: "The second screen shows the updated interaction state.", metric: "visible" },
    { label: "Binding", title: "Both embeddable", detail: "Each comparison panel has a fixture-owned media source.", metric: "2 assets" }
  ],
  comparison: { beforeAssetId: "flow-before", afterAssetId: "flow-after", beforeLabel: "Before / manual", afterLabel: "After / guided", note: "The comparison uses two original embed_asset states. It shows a bounded workflow change without borrowing reference screenshots." },
  caption: "Before-after: paired product states rendered from local original fixture media.",
  assetPolicyNote: "Only embed_asset records can occupy either comparison panel."
};
