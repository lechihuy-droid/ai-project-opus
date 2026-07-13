import type { ProductShowcaseFixture } from "../../../../src/styles/families/product-showcase";

const svgAsset = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const productShowcaseNormalFixture: ProductShowcaseFixture = {
  key: "normal",
  sceneLabel: "Normal",
  sceneType: "product-reveal",
  durationInFrames: 180,
  density: "balanced",
  motionPolicy: "full",
  eyebrow: "Wave 3 / Product Reveal",
  productName: "Lucida Review Console",
  title: "Put the product screen in view before the pitch starts",
  subtitle:
    "The reveal fixture uses one original embed_asset mockup as the first-viewport signal, then adds concise feature labels without a split marketing hero.",
  primaryAssetId: "console-portrait",
  assets: [
    {
      id: "console-portrait",
      src: svgAsset(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1280" viewBox="0 0 900 1280">
  <rect width="900" height="1280" fill="#eef5f1"/>
  <rect x="58" y="58" width="784" height="1164" rx="44" fill="#ffffff" stroke="#b7c9c0" stroke-width="4"/>
  <rect x="96" y="104" width="708" height="110" rx="24" fill="#14211c"/>
  <circle cx="142" cy="159" r="18" fill="#0f8f7a"/>
  <rect x="178" y="139" width="250" height="18" rx="9" fill="#dbe7e1"/>
  <rect x="178" y="168" width="376" height="14" rx="7" fill="#7b8a83"/>
  <rect x="96" y="254" width="708" height="260" rx="30" fill="#dcebe5"/>
  <rect x="132" y="294" width="308" height="38" rx="19" fill="#0f8f7a"/>
  <rect x="132" y="354" width="604" height="24" rx="12" fill="#52635b"/>
  <rect x="132" y="404" width="514" height="24" rx="12" fill="#8fa59a"/>
  <rect x="132" y="454" width="220" height="34" rx="17" fill="#ffffff"/>
  <rect x="96" y="552" width="334" height="248" rx="26" fill="#ffffff" stroke="#c7d7cf" stroke-width="3"/>
  <rect x="470" y="552" width="334" height="248" rx="26" fill="#ffffff" stroke="#c7d7cf" stroke-width="3"/>
  <rect x="132" y="590" width="152" height="18" rx="9" fill="#7b8a83"/>
  <rect x="132" y="640" width="238" height="88" rx="20" fill="#0f8f7a"/>
  <rect x="506" y="590" width="152" height="18" rx="9" fill="#7b8a83"/>
  <rect x="506" y="640" width="238" height="88" rx="20" fill="#2e9f5d"/>
  <rect x="96" y="842" width="708" height="300" rx="28" fill="#14211c"/>
  <path d="M144 1068 C226 1002 284 1038 346 962 C420 872 496 950 554 880 C620 800 700 842 756 754" fill="none" stroke="#0f8f7a" stroke-width="18" stroke-linecap="round"/>
  <rect x="144" y="902" width="214" height="22" rx="11" fill="#eef5f1"/>
  <rect x="144" y="944" width="322" height="14" rx="7" fill="#7b8a83"/>
</svg>`),
      kind: "image",
      usage: "embed_asset",
      alt: "Original portrait UI mockup of a review console",
      label: "Portrait UI mockup",
      orientation: "portrait",
      focalPoint: { x: 0.5, y: 0.48 },
    },
    {
      id: "mood-reference",
      src: "internal://not-rendered/style-reference",
      kind: "image",
      usage: "style_reference",
      alt: "Reference-only styling note",
      label: "Style reference",
      orientation: "landscape",
      focalPoint: { x: 0.5, y: 0.5 },
      missingReason: "Reference images are never embedded by this renderer.",
    },
  ],
  features: [
    {
      label: "Signal",
      title: "Product first",
      detail: "The UI mockup occupies the first viewport before supporting copy appears.",
      metric: "9:16",
    },
    {
      label: "Binding",
      title: "Embed only",
      detail: "Only assets marked embed_asset receive an image source at render time.",
      metric: "strict",
    },
    {
      label: "Crop",
      title: "Portrait focal lock",
      detail: "The renderer applies a deterministic object position from fixture metadata.",
      metric: "50/48",
    },
  ],
  caption:
    "Normal product reveal: one embeddable original UI asset, product-led stage, and short labels.",
  assetPolicyNote:
    "style_reference and context_only records stay visible only as placeholders.",
};
