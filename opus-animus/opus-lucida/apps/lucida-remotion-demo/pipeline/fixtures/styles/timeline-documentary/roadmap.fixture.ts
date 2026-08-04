import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineRoadmapFixture: TimelineDocumentaryFixture = {
  key: "roadmap", sceneType: "roadmap", durationInFrames: 180, density: "sparse", motionPolicy: "static",
  chapter: "Variant / Roadmap", title: "Three dated records turn one bounded conclusion into a roadmap", summary: "A compact static roadmap keeps evidence, archive limits, and the next review point visible at once.", dateRange: "2026-03 to 2026-09", footer: "roadmap / local fixture record",
  thesis: "The roadmap is limited to the displayed record and names the next review point without claiming approval, promotion, or a pattern beyond this local fixture.",
  events: [
    { id: "close-01", date: "2026-03-04", era: "Evidence", title: "The first dated record is retained", detail: "A source-forward label anchors the opening evidence point.", sourceLabel: "Local fixture record / opening note", sourceType: "record", image: { status: "available", label: "Opening record", treatment: "newsprint" }, emphasis: "primary" },
    { id: "close-02", date: "2026-04-27", era: "Limit", title: "One visual record is unavailable", detail: "The sequence keeps the absence visible rather than replacing it with an inferred image.", sourceLabel: "Local fixture record / limitation note", sourceType: "archive", image: { status: "missing", label: "No image retained for this record" } },
    { id: "close-03", date: "2026-09-15", era: "Roadmap", title: "The next review checkpoint is named", detail: "The footer separates the next review point from the dated evidence that limits it.", sourceLabel: "Local fixture record / roadmap note", sourceType: "analysis", image: { status: "available", label: "Roadmap ledger", treatment: "contact-sheet" }, emphasis: "primary" },
  ],
};
