import type { MotionPolicy, TextDensity } from "../../core";

export const newsRundownVariantIds = ["breaking-update", "headline-stack", "top-stories", "bulletin-grid", "weekly-roundup"] as const;
export type NewsRundownVariantId = (typeof newsRundownVariantIds)[number];

export type NewsItem = { label: string; headline: string; detail: string; timestamp?: string };
export type NewsRundownFixture = {
  key: NewsRundownVariantId;
  label: string;
  section: string;
  timestamp: string;
  headline: string;
  summary: string;
  sourceLabel: string;
  density: TextDensity;
  motionPolicy: MotionPolicy;
  items: NewsItem[];
  metric?: { value: string; label: string; change: string };
  caption: string;
};
