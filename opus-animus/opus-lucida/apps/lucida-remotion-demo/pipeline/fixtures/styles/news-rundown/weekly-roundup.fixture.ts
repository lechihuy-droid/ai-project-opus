import type { NewsRundownFixture } from "../../../../src/styles/families/news-rundown";

export const weeklyRoundupFixture: NewsRundownFixture = {
  key: "weekly-roundup", label: "Weekly roundup", section: "AI NEWS / WEEKLY", timestamp: "15:00 UTC",
  headline: "One adoption signal can frame this week's AI news roundup",
  summary: "A large weekly metric establishes the visual lead while supporting implications remain text-first.",
  sourceLabel: "Draft local briefing", density: "balanced", motionPolicy: "reduce",
  metric: { value: "+18%", label: "Illustrative weekly workflow usage change in local fixture data", change: "upward signal" },
  items: [
    { label: "Read", headline: "Adoption needs a time window", detail: "Do not infer causality from a single change." },
    { label: "Check", headline: "Compare active users with retained use", detail: "A second metric can qualify the headline." },
  ],
  caption: "The weekly number is deliberately illustrative. Production use requires approved data and date-bound editorial context.",
};
