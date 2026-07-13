import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  buildEntranceStyle,
  fitTypographyToBox,
  makeBox,
  resolveVerticalLayout,
  withAlpha,
} from "../../core";
import { paperNotebookFixtures } from "../../../../pipeline/fixtures/styles/paper-notebook";
import { paperNotebookTokens as tokens } from "./tokens";
import type {
  NotebookAnnotation,
  NotebookChecklistItem,
  NotebookEquation,
  NotebookNote,
  PaperNotebookFixture,
  PaperNotebookFixtureKey,
} from "./types";

const inkForTone = (tone: NotebookAnnotation["tone"]) =>
  tone === "red" ? tokens.color.danger : tone === "blue" ? tokens.color.accent : tokens.color.textMuted;

const entrance = (
  frame: number,
  fixture: PaperNotebookFixture,
  delayFrames: number,
  preset: "fade-up" | "fade-left" | "clip-up" = "fade-up",
): CSSProperties =>
  buildEntranceStyle({
    frame,
    durationInFrames: tokens.motion.normalFrames,
    delayFrames,
    preset,
    distance: tokens.motion.distanceSm,
    policy: fixture.motionPolicy,
  });

const PaperGrain = () => (
  <AbsoluteFill
    style={{
      backgroundImage: [
        "radial-gradient(circle at 18% 22%, rgba(70, 58, 39, 0.045) 0 1px, transparent 1.5px)",
        "radial-gradient(circle at 71% 64%, rgba(70, 58, 39, 0.035) 0 1px, transparent 1.5px)",
      ].join(","),
      backgroundSize: "31px 29px, 43px 47px",
      opacity: 0.7,
    }}
  />
);

const Annotation = ({ annotation, index, frame, fixture }: { annotation: NotebookAnnotation; index: number; frame: number; fixture: PaperNotebookFixture }) => {
  const ink = inkForTone(annotation.tone);
  return (
    <div
      style={{
        ...entrance(frame, fixture, 12 + index * 4, "fade-left"),
        padding: "14px 16px 14px 20px",
        borderLeft: `4px solid ${ink}`,
        transform: `${entrance(frame, fixture, 12 + index * 4, "fade-left").transform ?? ""} rotate(${index % 2 === 0 ? -0.7 : 0.7}deg)`,
      }}
    >
      <div style={{ color: ink, fontFamily: tokens.typography.label.fontFamily, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>{annotation.label}</div>
      <div style={{ marginTop: 6, color: tokens.color.textMuted, fontFamily: tokens.typography.caption.fontFamily, fontSize: 17, lineHeight: 1.32, fontWeight: 620 }}>{annotation.detail}</div>
    </div>
  );
};

const NoteRow = ({ note, index, frame, fixture }: { note: NotebookNote; index: number; frame: number; fixture: PaperNotebookFixture }) => (
  <div style={{ ...entrance(frame, fixture, 5 + index * 3), display: "grid", gridTemplateColumns: "34px 1fr", gap: 14, padding: "12px 8px 15px 0" }}>
    <div style={{ width: 27, height: 27, marginTop: 3, border: `3px solid ${index === 1 ? tokens.color.danger : tokens.color.accent}`, borderRadius: "50%", color: tokens.color.textStrong, fontFamily: tokens.typography.caption.fontFamily, fontSize: 14, fontWeight: 800, display: "grid", placeItems: "center", transform: `rotate(${index % 2 ? 4 : -5}deg)` }}>{index + 1}</div>
    <div>
      <div style={{ color: tokens.color.textStrong, fontFamily: tokens.typography.body.fontFamily, fontSize: 25, lineHeight: 1.28, fontWeight: 700 }}>{note.lead}</div>
      <div style={{ marginTop: 6, color: tokens.color.textMuted, fontFamily: tokens.typography.caption.fontFamily, fontSize: 18, lineHeight: 1.38, fontWeight: 620 }}>{note.detail}</div>
      {note.emphasis ? <div style={{ display: "inline-block", marginTop: 9, padding: "3px 7px", color: tokens.color.danger, background: withAlpha(tokens.color.danger, 0.08), borderBottom: `3px solid ${withAlpha(tokens.color.danger, 0.62)}`, fontFamily: tokens.typography.body.fontFamily, fontSize: 18, fontWeight: 700, transform: "rotate(-0.8deg)" }}>{note.emphasis}</div> : null}
    </div>
  </div>
);

const EquationRow = ({ equation, index, frame, fixture }: { equation: NotebookEquation; index: number; frame: number; fixture: PaperNotebookFixture }) => (
  <div style={{ ...entrance(frame, fixture, 5 + index * 4, "clip-up"), display: "grid", gridTemplateColumns: "42px 1fr", gap: 14, padding: "15px 0 18px", borderBottom: index < fixture.equations.length - 1 ? `1px dashed ${withAlpha(tokens.color.textMuted, 0.3)}` : "none" }}>
    <div style={{ color: tokens.color.danger, fontFamily: tokens.typography.body.fontFamily, fontSize: 22, fontWeight: 700 }}>{equation.label}</div>
    <div>
      <div style={{ color: tokens.color.textStrong, fontFamily: tokens.typography.mono.fontFamily, fontSize: fixture.density === "dense" ? 25 : 28, lineHeight: 1.25, fontWeight: 650, overflowWrap: "anywhere" }}>{equation.expression}</div>
      <div style={{ marginTop: 8, color: tokens.color.textMuted, fontFamily: tokens.typography.caption.fontFamily, fontSize: 17, lineHeight: 1.32, fontWeight: 620 }}>{equation.note}</div>
    </div>
  </div>
);

const ChecklistRow = ({ item, index, frame, fixture }: { item: NotebookChecklistItem; index: number; frame: number; fixture: PaperNotebookFixture }) => (
  <div style={{ ...entrance(frame, fixture, 5 + index * 3), display: "grid", gridTemplateColumns: "42px 1fr", gap: 14, padding: "13px 0 16px" }}>
    <div style={{ position: "relative", width: 29, height: 29, marginTop: 2, border: `3px solid ${item.checked ? tokens.color.success : tokens.color.textSoft}`, borderRadius: 3, transform: `rotate(${index % 2 ? 1.5 : -1.5}deg)` }}>
      {item.checked ? <><span style={{ position: "absolute", left: 4, top: 13, width: 10, height: 4, background: tokens.color.success, transform: "rotate(43deg)", transformOrigin: "left center" }} /><span style={{ position: "absolute", left: 10, top: 17, width: 20, height: 4, background: tokens.color.success, transform: "rotate(-49deg)", transformOrigin: "left center" }} /></> : null}
    </div>
    <div>
      <div style={{ color: item.checked ? tokens.color.textStrong : tokens.color.danger, fontFamily: tokens.typography.body.fontFamily, fontSize: 24, lineHeight: 1.25, fontWeight: 700, textDecoration: item.checked ? "none" : "underline", textDecorationColor: withAlpha(tokens.color.danger, 0.5), textDecorationThickness: 3, textUnderlineOffset: 5 }}>{item.label}</div>
      <div style={{ marginTop: 6, color: tokens.color.textMuted, fontFamily: tokens.typography.caption.fontFamily, fontSize: 18, lineHeight: 1.35, fontWeight: 620 }}>{item.detail}</div>
    </div>
  </div>
);

const MainContent = ({ fixture, frame }: { fixture: PaperNotebookFixture; frame: number }) => {
  if (fixture.sceneType === "derivation") return <>{fixture.equations.map((equation, index) => <EquationRow key={equation.label} equation={equation} index={index} frame={frame} fixture={fixture} />)}</>;
  if (fixture.sceneType === "checklist") return <>{fixture.checklist.map((item, index) => <ChecklistRow key={item.label} item={item} index={index} frame={frame} fixture={fixture} />)}</>;
  return <>{fixture.notes.map((note, index) => <NoteRow key={note.lead} note={note} index={index} frame={frame} fixture={fixture} />)}</>;
};

export const PaperNotebookScene = ({ sceneKey }: { sceneKey: PaperNotebookFixtureKey }) => {
  const frame = useCurrentFrame();
  const fixture = paperNotebookFixtures[sceneKey];
  const layout = resolveVerticalLayout({ platform: "tiktok", safeArea: tokens.safeArea, maxContentWidth: tokens.grid.maxContentWidth });
  const paperBox = makeBox(layout.content.x, layout.content.y - 24, layout.content.width, layout.content.height + 48);
  const titleFit = fitTypographyToBox({ tokens, role: "headline", text: fixture.title, width: 690, height: 150, maxLines: 3, density: fixture.density, minScale: 0.72 });

  return (
    <AbsoluteFill style={{ background: tokens.color.canvas, color: tokens.color.textStrong }}>
      <PaperGrain />
      <div style={{ position: "absolute", left: 36, top: 0, bottom: 0, width: 12, background: "repeating-linear-gradient(180deg, #8F887A 0 18px, #B9B1A2 18px 36px)", opacity: 0.3 }} />
      <BoxFrame box={paperBox} style={{ background: tokens.color.surface, border: `1px solid ${withAlpha(tokens.color.textMuted, 0.18)}`, boxShadow: tokens.surface.shadowRaised, overflow: "hidden" }}>
        <PaperGrain />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 43px, ${tokens.color.rule} 43px 45px)`, backgroundPosition: "0 274px" }} />
        <div style={{ position: "absolute", left: 82, top: 0, bottom: 0, width: 2, background: withAlpha(tokens.color.danger, 0.3) }} />
        <div style={{ position: "absolute", left: 88, top: 0, bottom: 0, width: 1, background: withAlpha(tokens.color.danger, 0.14) }} />
        {[142, 472, 802, 1132, 1462].map((top) => <div key={top} style={{ position: "absolute", left: 18, top, width: 25, height: 25, borderRadius: "50%", background: tokens.color.canvas, boxShadow: "inset 0 2px 5px rgba(47,42,32,0.22)" }} />)}

        <div style={{ position: "absolute", left: 116, right: 54, top: 42, bottom: 38, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 208px", gridTemplateRows: "285px minmax(0, 1fr) 42px", columnGap: 28 }}>
          <div style={{ ...entrance(frame, fixture, 0), gridColumn: "1 / 3", borderBottom: `2px solid ${withAlpha(tokens.color.accent, 0.48)}`, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, color: tokens.color.accent, fontFamily: tokens.typography.label.fontFamily, fontSize: 15, lineHeight: 1.2, fontWeight: 800, textTransform: "uppercase" }}><span>{fixture.eyebrow}</span><span>{fixture.dateLabel}</span></div>
            <div style={{ marginTop: 18, maxWidth: 720, color: tokens.color.textStrong, fontFamily: titleFit.style.fontFamily, fontSize: titleFit.style.fontSize, lineHeight: titleFit.style.lineHeight, fontWeight: titleFit.style.fontWeight }}>{fixture.title}</div>
            <div style={{ marginTop: 12, maxWidth: 760, color: tokens.color.textMuted, fontFamily: tokens.typography.caption.fontFamily, fontSize: 18, lineHeight: 1.32, fontWeight: 620 }}>{fixture.subtitle}</div>
            <div style={{ position: "absolute", right: 2, bottom: 18, width: 118, height: 52, border: `3px solid ${withAlpha(tokens.color.danger, 0.65)}`, borderRadius: "50%", transform: "rotate(-7deg)", display: "grid", placeItems: "center", color: tokens.color.danger, fontFamily: tokens.typography.body.fontFamily, fontSize: 17, fontWeight: 700 }}>{fixture.pageLabel}</div>
          </div>

          <div style={{ paddingTop: 24, minWidth: 0 }}>
            <div style={{ ...entrance(frame, fixture, 3), display: "inline-block", padding: "5px 9px", color: tokens.color.textStrong, background: withAlpha(tokens.color.warning, 0.18), borderBottom: `4px solid ${withAlpha(tokens.color.warning, 0.42)}`, fontFamily: tokens.typography.body.fontFamily, fontSize: 23, lineHeight: 1.2, fontWeight: 700, transform: "rotate(-0.5deg)" }}>{fixture.sectionTitle}</div>
            <div style={{ marginTop: 12 }}><MainContent fixture={fixture} frame={frame} /></div>
          </div>

          <div style={{ paddingTop: 30, borderLeft: `1px dashed ${withAlpha(tokens.color.textMuted, 0.3)}`, display: "grid", alignContent: "start", gap: 22 }}>
            {fixture.annotations.map((annotation, index) => <Annotation key={annotation.label} annotation={annotation} index={index} frame={frame} fixture={fixture} />)}
          </div>

          <div style={{ gridColumn: "1 / 3", alignSelf: "end", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 18, color: tokens.color.textSoft, fontFamily: tokens.typography.caption.fontFamily, fontSize: 14, lineHeight: 1.25, fontWeight: 650 }}><span>{fixture.footer}</span><span>paper-notebook / {fixture.sceneType}</span></div>
        </div>
      </BoxFrame>
    </AbsoluteFill>
  );
};
