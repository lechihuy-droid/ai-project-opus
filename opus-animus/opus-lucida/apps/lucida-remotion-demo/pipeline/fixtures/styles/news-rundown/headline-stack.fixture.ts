import type { NewsRundownFixture } from "../../../../src/styles/families/news-rundown";

export const headlineStackFixture: NewsRundownFixture = {
  key: "headline-stack", label: "Headline stack", section: "AI NEWS / DAILY RUN", timestamp: "12:00 UTC",
  headline: "Four AI updates worth separating before the daily standup",
  summary: "A ranked editorial stack gives the lead item priority while keeping secondary signals legible.",
  sourceLabel: "Draft local briefing", density: "dense", motionPolicy: "reduce",
  items: [
    { label: "Platform", headline: "Enterprise controls become the lead story", detail: "Governance changes can alter adoption timing." },
    { label: "Research", headline: "Evaluation focus shifts to task reliability", detail: "Benchmarks need operational context." },
    { label: "Product", headline: "Workflow features narrow the integration gap", detail: "Watch for repeatable user value." },
    { label: "Policy", headline: "Disclosure rules remain a planning input", detail: "Track dates separately from interpretation." },
  ],
  caption: "Ranking is visual, not a claim of factual importance. Replace local fixture text with approved editorial input before production.",
};
