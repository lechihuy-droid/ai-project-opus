import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";

const svgAsset = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const productShowcaseEdgeFixture: ProductShowcaseFixture = {
  key: "edge",
  sceneLabel: "Edge",
  sceneType: "before-after",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "static",
  eyebrow: "Wave 3 / Before After",
  productName: "Lucida Asset Binding Guard",
  title: "Show a truthful before-after even when one asset is not embeddable",
  subtitle:
    "The edge fixture compares a context-only before state against an embeddable after state, proving that non-embed assets produce deliberate placeholders instead of broken images.",
  primaryAssetId: "after-portrait",
  assets: [
    {
      id: "before-context",
      src: "internal://not-rendered/before-context",
      kind: "image",
      usage: "context_only",
      alt: "Context-only before state",
      label: "Before state",
      orientation: "portrait",
      focalPoint: { x: 0.5, y: 0.52 },
      missingReason: "Before source is context_only and cannot be embedded.",
    },
    {
      id: "after-portrait",
      src: svgAsset(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1280" viewBox="0 0 900 1280">
  <rect width="900" height="1280" fill="#f4f8f5"/>
  <rect x="74" y="68" width="752" height="1144" rx="42" fill="#ffffff" stroke="#b7c9c0" stroke-width="4"/>
  <rect x="118" y="112" width="664" height="132" rx="28" fill="#14211c"/>
  <rect x="154" y="154" width="248" height="24" rx="12" fill="#dbe7e1"/>
  <rect x="154" y="196" width="410" height="16" rx="8" fill="#7b8a83"/>
  <rect x="118" y="286" width="312" height="338" rx="28" fill="#dcebe5"/>
  <rect x="470" y="286" width="312" height="338" rx="28" fill="#eaf3ee"/>
  <path d="M168 548 L232 466 L290 506 L362 404" fill="none" stroke="#0f8f7a" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="510" y="338" width="220" height="34" rx="17" fill="#0f8f7a"/>
  <rect x="510" y="404" width="190" height="18" rx="9" fill="#52635b"/>
  <rect x="510" y="454" width="214" height="18" rx="9" fill="#8fa59a"/>
  <rect x="118" y="676" width="664" height="142" rx="26" fill="#ffffff" stroke="#d3e0da" stroke-width="3"/>
  <rect x="158" y="720" width="180" height="22" rx="11" fill="#52635b"/>
  <rect x="158" y="770" width="508" height="16" rx="8" fill="#8fa59a"/>
  <rect x="118" y="862" width="664" height="242" rx="28" fill="#14211c"/>
  <rect x="164" y="910" width="214" height="22" rx="11" fill="#eef5f1"/>
  <rect x="164" y="968" width="488" height="18" rx="9" fill="#7b8a83"/>
  <rect x="164" y="1022" width="382" height="18" rx="9" fill="#7b8a83"/>
</svg>`),
      kind: "image",
      usage: "embed_asset",
      alt: "Original after-state portrait UI mockup",
      label: "After state",
      orientation: "portrait",
      focalPoint: { x: 0.5, y: 0.5 },
    },
    {
      id: "missing-after-variant",
      kind: "image",
      usage: "embed_asset",
      alt: "Missing alternate after state",
      label: "Missing alternate",
      orientation: "landscape",
      focalPoint: { x: 0.5, y: 0.5 },
      missingReason: "The asset is marked embed_asset but has no source.",
    },
  ],
  features: [
    {
      label: "Before",
      title: "Context-only blocked",
      detail: "The left side intentionally becomes a placeholder because the usage is context_only.",
      metric: "guarded",
    },
    {
      label: "After",
      title: "Embeddable UI renders",
      detail: "The right side uses the original embed_asset mockup with a deterministic crop.",
      metric: "ready",
    },
    {
      label: "Missing",
      title: "No broken images",
      detail: "Missing sources are represented by an explicit placeholder and reason string.",
      metric: "truthful",
    },
  ],
  comparison: {
    beforeAssetId: "before-context",
    afterAssetId: "after-portrait",
    beforeLabel: "Before / context_only",
    afterLabel: "After / embed_asset",
    note:
      "Only the right asset is embeddable. The left side proves the renderer refuses context_only media and replaces it with a deliberate placeholder.",
  },
  caption:
    "Edge before-after: mixed usage classifications, static reduced motion, and no fallback to unavailable media.",
  assetPolicyNote:
    "Missing embed_asset sources and non-embed usages both resolve to placeholders.",
};
