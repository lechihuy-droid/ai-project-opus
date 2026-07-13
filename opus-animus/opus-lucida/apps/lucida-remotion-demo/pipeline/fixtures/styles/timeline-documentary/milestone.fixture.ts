import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineMilestoneFixture: TimelineDocumentaryFixture = {
  key: "milestone", sceneType: "milestone", durationInFrames: 210, density: "balanced", motionPolicy: "full",
  chapter: "Chapter 01 / Milestones", title: "A public network moves from proposal to shared infrastructure", summary: "Four dated records establish the sequence without filling documentary gaps.", dateRange: "1969-1983", footer: "milestone review / archive labels visible",
  thesis: "The decisive shift was not one invention, but a sequence of compatible decisions that made participation repeatable.",
  events: [
    { id: "e1", date: "29 OCT 1969", era: "Origins", title: "The first host-to-host message", detail: "A short transmission demonstrates that remote computers can share a network path.", sourceLabel: "UCLA Network Measurement Center log", sourceType: "archive", image: { status: "available", label: "Interface message processor sketch", treatment: "blueprint" }, emphasis: "primary" },
    { id: "e2", date: "1971", era: "Expansion", title: "Fifteen nodes join the network", detail: "The experiment expands beyond its original four research sites.", sourceLabel: "ARPANET completion report", sourceType: "record", image: { status: "missing", label: "Node map not licensed" } },
    { id: "e3", date: "1974", era: "Protocol", title: "A common internetwork protocol is described", detail: "The proposal separates local networks from a shared transmission method.", sourceLabel: "IEEE Transactions on Communications", sourceType: "analysis", image: { status: "available", label: "Protocol working notes", treatment: "newsprint" }, emphasis: "primary" },
    { id: "e4", date: "01 JAN 1983", era: "Adoption", title: "TCP/IP becomes the operating standard", detail: "Participating hosts complete the coordinated transition to a common protocol suite.", sourceLabel: "Defense Communications Agency transition plan", sourceType: "record", image: { status: "available", label: "Transition contact sheet", treatment: "contact-sheet" }, emphasis: "primary" },
  ],
};
