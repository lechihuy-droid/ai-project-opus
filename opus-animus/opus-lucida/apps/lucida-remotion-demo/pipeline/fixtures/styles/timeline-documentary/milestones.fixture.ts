import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineMilestonesFixture: TimelineDocumentaryFixture = {
  key: "milestones", sceneType: "milestones", durationInFrames: 225, density: "balanced", motionPolicy: "reduce",
  chapter: "Variant / Milestones", title: "The record marks what is missing before it draws a conclusion", summary: "Five fixture-bound milestones make visual gaps visible without inventing a replacement image or external evidence.", dateRange: "2026-02 to 2026-05", footer: "milestones / local fixture record",
  thesis: "A chronology remains more defensible when its missing records are legible alongside the records that remain.",
  events: [
    { id: "gap-01", date: "2026-02-07", era: "Inventory", title: "Available records are listed", detail: "The local review starts with the materials present in the fixture.", sourceLabel: "Local fixture record / inventory", sourceType: "record", image: { status: "available", label: "Inventory page", treatment: "newsprint" }, emphasis: "primary" },
    { id: "gap-02", date: "2026-02-21", era: "Gap", title: "A referenced image is unavailable", detail: "The event retains a missing-image state and the reason it cannot be displayed.", sourceLabel: "Local fixture record / archive gap", sourceType: "archive", image: { status: "missing", label: "Referenced image unavailable in local fixture" } },
    { id: "gap-03", date: "2026-03-19", era: "Context", title: "Adjacent evidence is retained", detail: "The source label identifies the available record without pretending it fills the gap.", sourceLabel: "Local fixture record / context note", sourceType: "analysis", image: { status: "available", label: "Context sketch", treatment: "blueprint" } },
    { id: "gap-04", date: "2026-04-15", era: "Gap", title: "A second record remains absent", detail: "The visual state distinguishes absent media from an unreviewed event.", sourceLabel: "Local fixture record / archive gap", sourceType: "archive", image: { status: "missing", label: "Second image not retained" } },
    { id: "gap-05", date: "2026-05-29", era: "Finding", title: "The conclusion names the limit", detail: "The final interpretation is restricted to the dated records visible in the fixture.", sourceLabel: "Local fixture record / finding note", sourceType: "analysis", image: { status: "available", label: "Finding sheet", treatment: "contact-sheet" }, emphasis: "primary" },
  ],
};
