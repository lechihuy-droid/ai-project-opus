import type { NewsRundownFixture } from "../../../../src/styles/families/news-rundown";

export const bulletinGridFixture: NewsRundownFixture = {
  key: "bulletin-grid", label: "Bulletin grid", section: "AI NEWS / BULLETIN", timestamp: "14:10 UTC",
  headline: "A policy bulletin needs context before it becomes an action item",
  summary: "The bulletin grid separates the change itself from scope, implication, and the next question.",
  sourceLabel: "Draft local briefing", density: "balanced", motionPolicy: "full",
  items: [
    { label: "What changed", headline: "A new disclosure expectation", detail: "Name the observable update." },
    { label: "Who is in scope", headline: "Teams shipping AI features", detail: "Keep the affected group explicit." },
    { label: "Why it matters", headline: "Review work may move earlier", detail: "Show the operating implication." },
    { label: "What to watch", headline: "Implementation guidance", detail: "Reserve uncertainty for the next fact check." },
  ],
  caption: "Use four bounded bulletin units when the story needs orientation more than urgency.",
};
