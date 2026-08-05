import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineCaseStudyFixture: TimelineDocumentaryFixture = {
  key: "case-study", sceneType: "case-study", durationInFrames: 225, density: "balanced", motionPolicy: "full",
  chapter: "Variant / Case study", title: "One documented decision changes how the local sequence is read", summary: "Five records preserve the lead-up and result around one explicitly emphasized case decision.", dateRange: "2026-02 to 2026-06", footer: "case study / local fixture record",
  thesis: "The turning point matters because it connects prior constraints to a repeatable review action.",
  events: [
    { id: "turn-01", date: "2026-02-14", era: "Constraint", title: "Inputs arrive without a common date field", detail: "Reviewers cannot compare sequence order when records use incompatible date labels.", sourceLabel: "Local fixture record / intake note", sourceType: "record", image: { status: "available", label: "Intake sheet", treatment: "newsprint" } },
    { id: "turn-02", date: "2026-03-01", era: "Test", title: "A dated spine is trialed", detail: "The trial makes chronology visible while keeping every event source label in place.", sourceLabel: "Local fixture record / trial note", sourceType: "analysis", image: { status: "available", label: "Trial diagram", treatment: "blueprint" } },
    { id: "turn-03", date: "2026-03-18", era: "Decision", title: "Evidence labels become persistent", detail: "The working decision prevents a conclusion from becoming detached from its supporting records.", sourceLabel: "Local fixture record / decision note", sourceType: "record", image: { status: "available", label: "Decision ledger", treatment: "contact-sheet" }, emphasis: "primary" },
    { id: "turn-04", date: "2026-04-09", era: "Adoption", title: "Missing images are named directly", detail: "Unavailable images receive a visible record state rather than a substitute illustration.", sourceLabel: "Local fixture record / adoption note", sourceType: "record", image: { status: "missing", label: "Image not present in local record" } },
    { id: "turn-05", date: "2026-06-05", era: "Result", title: "Review remains reproducible", detail: "A subsequent reviewer can follow dates, source labels, and the stated conclusion in one frame.", sourceLabel: "Local fixture record / result note", sourceType: "analysis", image: { status: "available", label: "Review sequence", treatment: "newsprint" }, emphasis: "primary" },
  ],
};
