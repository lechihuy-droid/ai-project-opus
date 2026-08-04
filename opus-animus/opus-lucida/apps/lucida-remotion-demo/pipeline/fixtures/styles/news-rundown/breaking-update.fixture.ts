import type { NewsRundownFixture } from "../../../../src/styles/families/news-rundown";

export const breakingUpdateFixture: NewsRundownFixture = {
  key: "breaking-update", label: "Breaking update", section: "AI NEWS / BREAKING", timestamp: "10:40 UTC",
  headline: "Breaking update: a model release changes the competitive baseline for AI assistants",
  summary: "A new capability tier moves from preview claims into an update teams need to evaluate.",
  sourceLabel: "Draft local briefing", density: "balanced", motionPolicy: "full",
  items: [{ label: "Immediate read", headline: "Capability matters only when deployment details are clear", detail: "Keep the visual focused on the one decision that changed." }],
  caption: "Use this layout for one consequential update; it remains a local draft fixture, not a sourced reporting claim.",
};
