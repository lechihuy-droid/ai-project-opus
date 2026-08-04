import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineChronologyFixture: TimelineDocumentaryFixture = {
  key: "chronology", sceneType: "chronology", durationInFrames: 210, density: "balanced", motionPolicy: "full",
  chapter: "Variant / Chronology", title: "A local chronology begins with the records that made shared review possible", summary: "Four fixture-bound records establish a chronology without making an external approval claim.", dateRange: "2026-01 to 2026-04", footer: "chronology / local fixture record",
  thesis: "The starting point is a documented sequence of decisions, not a retrospective origin story.",
  events: [
    { id: "origin-01", date: "2026-01-08", era: "Scope", title: "Chronology fields are fixed", detail: "The local record defines dates, labels, and evidence notes before visual treatment is considered.", sourceLabel: "Local fixture record / scope note", sourceType: "record", image: { status: "available", label: "Field ledger", treatment: "newsprint" }, emphasis: "primary" },
    { id: "origin-02", date: "2026-02-03", era: "Structure", title: "The dated spine becomes the anchor", detail: "Each subsequent event is ordered around one visible source-forward chronology.", sourceLabel: "Local fixture record / layout note", sourceType: "analysis", image: { status: "available", label: "Spine sketch", treatment: "blueprint" }, emphasis: "primary" },
    { id: "origin-03", date: "2026-03-11", era: "Evidence", title: "Source labels remain attached", detail: "The sequence retains event-level provenance rather than moving it into a final footnote.", sourceLabel: "Local fixture record / evidence note", sourceType: "record", image: { status: "missing", label: "Original source image unavailable" } },
    { id: "origin-04", date: "2026-04-02", era: "Review", title: "A concise finding closes the record", detail: "The documentary finding is separate from the dated evidence it interprets.", sourceLabel: "Local fixture record / review note", sourceType: "analysis", image: { status: "available", label: "Review contact sheet", treatment: "contact-sheet" }, emphasis: "primary" },
  ],
};
