import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineConclusionFixture: TimelineDocumentaryFixture = {
  key: "conclusion", sceneType: "conclusion", durationInFrames: 195, density: "balanced", motionPolicy: "static",
  chapter: "Chapter 03 / Conclusion", title: "Three records explain why the archive ends with stewardship, not certainty", summary: "The minimum supported event count and missing-image path remain fully composed.", dateRange: "2014-2026", footer: "conclusion review / static",
  thesis: "A timeline can establish sequence and consequence, but its final responsibility is to expose the record, its gaps, and the choices still open.",
  events: [
    { id: "e1", date: "2014", era: "Access", title: "Mobile access becomes the majority path", detail: "Usage reports mark a durable change in how public information is reached.", sourceLabel: "Global web traffic summaries", sourceType: "analysis", image: { status: "available", label: "Traffic study folio", treatment: "newsprint" }, emphasis: "primary" },
    { id: "e2", date: "2020", era: "Dependency", title: "Public life moves through networked systems", detail: "Remote work and services reveal both resilience and unequal access.", sourceLabel: "Institutional continuity reports", sourceType: "record", image: { status: "missing", label: "No embeddable field image" }, emphasis: "primary" },
    { id: "e3", date: "2026", era: "Stewardship", title: "The next era remains an editorial choice", detail: "Governance, preservation, and accessibility determine what the public record can become.", sourceLabel: "Lucida synthesis from listed records", sourceType: "analysis", image: { status: "missing", label: "Future image intentionally absent" }, emphasis: "primary" },
  ],
};
