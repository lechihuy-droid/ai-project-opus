import type { NewsRundownFixture } from "../../../../src/styles/families/news-rundown";

export const topStoriesFixture: NewsRundownFixture = {
  key: "top-stories", label: "Top stories", section: "AI NEWS / TOP STORIES", timestamp: "13:20 UTC",
  headline: "Top stories: separate the developments that need attention today",
  summary: "A time-marked rail preserves story sequence without implying verification of external events.",
  sourceLabel: "Draft local briefing", density: "balanced", motionPolicy: "reduce",
  items: [
    { label: "Top story", timestamp: "09:00", headline: "Teams flag a release note for review", detail: "The lead signal identifies a possible change." },
    { label: "Second story", timestamp: "10:15", headline: "Implementation details begin to clarify", detail: "Separate stated scope from inferred impact." },
    { label: "Watch next", timestamp: "11:30", headline: "Operators wait for rollout evidence", detail: "The ordered rail makes the next check explicit." },
  ],
  caption: "This ordered view keeps top stories distinct. It does not convert fixture text into an approved source record.",
};
