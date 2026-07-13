import type { TimelineDocumentaryFixture } from "../../../../src/styles/families/timeline-documentary";

export const timelineEraChangeFixture: TimelineDocumentaryFixture = {
  key: "era-change", sceneType: "era-change", durationInFrames: 240, density: "dense", motionPolicy: "reduce",
  chapter: "Chapter 02 / Era Change", title: "Seven records trace the web from specialist tool to public medium", summary: "Dense mode compresses detail, never source identity.", dateRange: "1989-2007", footer: "era-change review / reduced motion",
  thesis: "Open standards lowered the cost of publishing; browsers, search, and mobile access then changed who could participate.",
  events: [
    { id: "e1", date: "MAR 1989", era: "Proposal", title: "A web of linked information", detail: "", sourceLabel: "CERN information management proposal", sourceType: "record", image: { status: "available", label: "Proposal folio", treatment: "newsprint" }, emphasis: "primary" },
    { id: "e2", date: "DEC 1990", era: "Prototype", title: "First server and browser operate", detail: "", sourceLabel: "CERN project archive", sourceType: "archive", image: { status: "missing", label: "Workstation photograph unavailable" } },
    { id: "e3", date: "APR 1993", era: "Release", title: "Web software enters the public domain", detail: "", sourceLabel: "CERN public statement", sourceType: "record", image: { status: "available", label: "Release bulletin", treatment: "contact-sheet" }, emphasis: "primary" },
    { id: "e4", date: "1994", era: "Institutions", title: "Standards work gains a permanent home", detail: "", sourceLabel: "W3C founding record", sourceType: "record", image: { status: "available", label: "Standards notes", treatment: "blueprint" } },
    { id: "e5", date: "1998", era: "Discovery", title: "Search becomes an organizing layer", detail: "", sourceLabel: "Contemporary company filings", sourceType: "analysis", image: { status: "missing", label: "Search interface omitted" } },
    { id: "e6", date: "2001", era: "Participation", title: "Collaborative publishing scales", detail: "", sourceLabel: "Wikipedia project history", sourceType: "archive", image: { status: "available", label: "Community edit record", treatment: "newsprint" } },
    { id: "e7", date: "2007", era: "Mobility", title: "The web leaves the desk", detail: "", sourceLabel: "Mobile platform launch records", sourceType: "record", image: { status: "missing", label: "Device image not registered" }, emphasis: "primary" },
  ],
};
