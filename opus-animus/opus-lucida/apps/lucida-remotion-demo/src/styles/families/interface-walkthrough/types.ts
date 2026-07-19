export const interfaceWalkthroughVariantIds = [
  "annotated-screen",
  "step-flow",
  "feature-tour",
  "before-after-ui",
  "state-transition",
] as const;

export type InterfaceWalkthroughVariantId = (typeof interfaceWalkthroughVariantIds)[number];

export type InterfaceWalkthroughFixture = {
  key: InterfaceWalkthroughVariantId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  density: "sparse" | "balanced" | "dense";
  motionPolicy: "full" | "reduced" | "static";
  product: string;
  layout: "dashboard" | "workflow" | "settings" | "table" | "mobile";
  navigation: string[];
  items: {label: string; detail: string; state?: "ready" | "active" | "complete" | "blocked"}[];
  focusLabel: string;
  focusDetail: string;
  caption: string;
};
