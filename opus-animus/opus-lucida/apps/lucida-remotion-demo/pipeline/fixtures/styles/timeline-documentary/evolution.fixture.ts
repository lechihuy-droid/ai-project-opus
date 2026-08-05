import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineEvolutionFixture: TimelineDocumentaryFixture = {
  key: "evolution", sceneType: "evolution", durationInFrames: 240, density: "balanced", motionPolicy: "reduce",
  chapter: "Variant / Evolution", title: "Two local workstreams converge on one evolving review record", summary: "Six compact records interleave evidence and rendering work without implying that either stream is a source of approval.", dateRange: "2026-01 to 2026-06", footer: "evolution / local fixture record",
  thesis: "A shared chronology exposes the dependencies between evidence handling and deterministic rendering.",
  events: [
    { id: "parallel-01", date: "2026-01-16", era: "Evidence", title: "Record fields are enumerated", detail: "The evidence workstream lists the fixture fields needed for dated review.", sourceLabel: "Local fixture record / evidence stream", sourceType: "record", image: { status: "available", label: "Record matrix", treatment: "newsprint" }, emphasis: "primary" },
    { id: "parallel-02", date: "2026-02-02", era: "Rendering", title: "A fixed scene shape is tested", detail: "The rendering workstream bounds the event field for deterministic output.", sourceLabel: "Local fixture record / rendering stream", sourceType: "analysis", image: { status: "available", label: "Scene blueprint", treatment: "blueprint" } },
    { id: "parallel-03", date: "2026-02-26", era: "Evidence", title: "Source labels move into each event", detail: "The labels are retained at the point where readers inspect the chronology.", sourceLabel: "Local fixture record / evidence stream", sourceType: "record", image: { status: "missing", label: "No visual source retained" } },
    { id: "parallel-04", date: "2026-03-22", era: "Rendering", title: "Compact mode protects the spine", detail: "Dense chronology reduces detail copy while preserving dates and sources.", sourceLabel: "Local fixture record / rendering stream", sourceType: "analysis", image: { status: "available", label: "Compact layout", treatment: "contact-sheet" } },
    { id: "parallel-05", date: "2026-04-18", era: "Evidence", title: "Archive gaps stay visible", detail: "Unavailable imagery is described as unavailable rather than recreated.", sourceLabel: "Local fixture record / evidence stream", sourceType: "record", image: { status: "missing", label: "Archived image unavailable" } },
    { id: "parallel-06", date: "2026-06-12", era: "Convergence", title: "Review constraints align", detail: "Both workstreams now describe the same fixture-bound sequence and conclusion boundary.", sourceLabel: "Local fixture record / convergence note", sourceType: "analysis", image: { status: "available", label: "Convergence record", treatment: "newsprint" }, emphasis: "primary" },
  ],
};
