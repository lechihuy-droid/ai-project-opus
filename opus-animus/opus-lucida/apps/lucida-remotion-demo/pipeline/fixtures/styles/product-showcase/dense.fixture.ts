import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";

const svgAsset = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const productShowcaseDenseFixture: ProductShowcaseFixture = {
  key: "dense",
  sceneLabel: "Dense",
  sceneType: "feature-focus",
  durationInFrames: 210,
  density: "dense",
  motionPolicy: "reduce",
  eyebrow: "Wave 3 / Feature Focus",
  productName: "Lucida Visual Package Inspector",
  title: "Keep the feature walkthrough tied to the actual interface state",
  subtitle:
    "Dense mode still leads with product/UI media. Feature callouts compress into a measured control surface instead of turning into a copy-heavy hero.",
  primaryAssetId: "inspector-landscape",
  assets: [
    {
      id: "inspector-landscape",
      src: svgAsset(`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" fill="#f5f8f6"/>
  <rect x="58" y="58" width="1324" height="784" rx="34" fill="#ffffff" stroke="#bed0c8" stroke-width="4"/>
  <rect x="58" y="58" width="1324" height="82" rx="34" fill="#14211c"/>
  <circle cx="106" cy="100" r="12" fill="#c84f55"/>
  <circle cx="144" cy="100" r="12" fill="#c58a1b"/>
  <circle cx="182" cy="100" r="12" fill="#2e9f5d"/>
  <rect x="240" y="86" width="330" height="22" rx="11" fill="#dbe7e1"/>
  <rect x="98" y="178" width="278" height="624" rx="24" fill="#edf4f0"/>
  <rect x="416" y="178" width="600" height="624" rx="24" fill="#ffffff" stroke="#d3e0da" stroke-width="3"/>
  <rect x="1056" y="178" width="286" height="624" rx="24" fill="#edf4f0"/>
  <rect x="134" y="220" width="188" height="20" rx="10" fill="#52635b"/>
  <rect x="134" y="272" width="204" height="52" rx="16" fill="#0f8f7a"/>
  <rect x="134" y="352" width="204" height="52" rx="16" fill="#ffffff"/>
  <rect x="134" y="432" width="204" height="52" rx="16" fill="#ffffff"/>
  <rect x="458" y="220" width="426" height="30" rx="15" fill="#14211c"/>
  <rect x="458" y="286" width="500" height="164" rx="24" fill="#dcebe5"/>
  <rect x="494" y="324" width="200" height="24" rx="12" fill="#0f8f7a"/>
  <rect x="494" y="372" width="392" height="18" rx="9" fill="#52635b"/>
  <rect x="458" y="492" width="224" height="230" rx="22" fill="#ffffff" stroke="#d3e0da" stroke-width="3"/>
  <rect x="724" y="492" width="224" height="230" rx="22" fill="#ffffff" stroke="#d3e0da" stroke-width="3"/>
  <rect x="1094" y="222" width="152" height="18" rx="9" fill="#52635b"/>
  <rect x="1094" y="274" width="210" height="36" rx="18" fill="#0f8f7a"/>
  <rect x="1094" y="342" width="190" height="14" rx="7" fill="#7b8a83"/>
  <rect x="1094" y="402" width="210" height="36" rx="18" fill="#2e9f5d"/>
  <rect x="1094" y="470" width="190" height="14" rx="7" fill="#7b8a83"/>
</svg>`),
      kind: "image",
      usage: "embed_asset",
      alt: "Original landscape UI mockup of a package inspector",
      label: "Landscape UI mockup",
      orientation: "landscape",
      focalPoint: { x: 0.54, y: 0.45 },
    },
    {
      id: "research-context",
      src: "internal://not-rendered/context-only",
      kind: "image",
      usage: "context_only",
      alt: "Context-only research note",
      label: "Context-only research",
      orientation: "landscape",
      focalPoint: { x: 0.5, y: 0.5 },
      missingReason: "Context-only assets explain source intent but are not embedded.",
    },
  ],
  features: [
    {
      label: "Panel",
      title: "Inspector state",
      detail: "The center panel remains the subject while secondary controls sit inside the mock UI.",
      metric: "focus",
    },
    {
      label: "Feature",
      title: "Contract badges",
      detail: "Dense labels describe behavior without inventing product claims or brand UI.",
      metric: "4 notes",
    },
    {
      label: "Asset",
      title: "Landscape crop",
      detail: "The landscape mockup uses a locked 54/45 focal point in the portrait stage.",
      metric: "54/45",
    },
    {
      label: "Guard",
      title: "References blocked",
      detail: "The context-only record is intentionally rendered as a placeholder if selected.",
      metric: "no embed",
    },
  ],
  caption:
    "Dense feature focus: product media stays dominant, with compact notes constrained below and inside the product stage.",
  assetPolicyNote:
    "The renderer does not use reference/context assets as hidden fallbacks.",
};
