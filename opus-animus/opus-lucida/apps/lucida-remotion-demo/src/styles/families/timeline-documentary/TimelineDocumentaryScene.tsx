import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  MediaFrame,
  buildEntranceStyle,
  buildStaggeredEntrance,
  fitTypographyToBox,
  resolveVerticalLayout,
  withAlpha,
} from "../../core";
import { timelineDocumentaryFixtures } from "../../../../pipeline/fixtures/styles/timeline-documentary";
import { timelineDocumentaryTokens as tokens } from "./tokens";
import type { TimelineDocumentaryEvent, TimelineDocumentaryFixtureKey } from "./types";

const paper = "#E9E2D2";

const texture: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 5px)",
    "radial-gradient(circle at 18% 23%, rgba(216,169,59,0.09), transparent 26%)",
  ].join(", "),
};

const ArchiveVisual = ({ event }: { event: TimelineDocumentaryEvent }) => {
  if (!event.image || event.image.status === "missing") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <MediaFrame
          tokens={tokens}
          status="missing"
          label=""
          reason=""
          style={{ borderRadius: 2, background: "#343732" }}
        />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 8, background: "rgba(39,42,39,.74)", color: paper, textAlign: "center" }}>
          <div style={{ width: 30, height: 22, border: `1px solid ${tokens.color.accent}`, color: tokens.color.accent, fontFamily: tokens.typography.mono.fontFamily, fontSize: 9, lineHeight: "20px" }}>IMG</div>
          <div style={{ marginTop: 7, fontFamily: tokens.typography.label.fontFamily, fontSize: 10, lineHeight: 1.15, fontWeight: 750, textTransform: "uppercase" }}>Archive gap</div>
          <div style={{ marginTop: 3, fontFamily: tokens.typography.caption.fontFamily, fontSize: 8, lineHeight: 1.1, color: tokens.color.textMuted }}>{event.image?.label ?? "No image recorded"}</div>
        </div>
      </div>
    );
  }

  const treatment = event.image.treatment ?? "newsprint";
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: treatment === "blueprint" ? "#243B46" : "#B7AE9B", ...texture }}>
      <div style={{ position: "absolute", inset: 12, border: `1px solid ${treatment === "blueprint" ? "rgba(230,239,231,.5)" : "rgba(42,43,38,.38)"}` }} />
      {treatment === "contact-sheet" ? (
        <div style={{ position: "absolute", inset: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {Array.from({ length: 6 }, (_, index) => <div key={index} style={{ background: index % 2 ? "#474A43" : "#6C6D63", border: "5px solid #D6CEBC" }} />)}
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", left: "12%", right: "12%", bottom: "18%", height: "42%", border: `2px solid ${treatment === "blueprint" ? "rgba(230,239,231,.72)" : "rgba(42,43,38,.55)"}`, transform: "skewY(-3deg)" }} />
          <div style={{ position: "absolute", left: "20%", top: "19%", width: "48%", height: 3, background: treatment === "blueprint" ? "rgba(230,239,231,.65)" : "rgba(42,43,38,.48)" }} />
          <div style={{ position: "absolute", left: "20%", top: "25%", width: "61%", height: 2, background: treatment === "blueprint" ? "rgba(230,239,231,.42)" : "rgba(42,43,38,.32)" }} />
        </>
      )}
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 12, color: treatment === "blueprint" ? "#E6EFE7" : "#2A2B26", fontFamily: tokens.typography.mono.fontFamily, fontSize: 12, textTransform: "uppercase" }}>{event.image.label}</div>
    </div>
  );
};

const EventRow = ({ event, index, count, frame, policy }: { event: TimelineDocumentaryEvent; index: number; count: number; frame: number; policy: "full" | "reduce" | "static" }) => {
  const isLeft = index % 2 === 0;
  const compact = count >= 7;
  const rowHeight = compact ? 142 : count >= 6 ? 166 : 194;
  const mediaWidth = compact ? 126 : 154;
  const textWidth = 318;
  return (
    <div style={{ position: "relative", height: rowHeight, ...buildStaggeredEntrance(index, { frame, startFrame: 8, durationInFrames: 24, policy, preset: isLeft ? "fade-right" : "fade-left" }, 4) }}>
      <div style={{ position: "absolute", left: "50%", top: 14, width: 14, height: 14, borderRadius: "50%", transform: "translateX(-50%)", background: event.emphasis === "primary" ? tokens.color.accent : paper, border: `3px solid ${tokens.color.canvas}`, boxShadow: `0 0 0 1px ${withAlpha(tokens.color.accent, 0.75)}`, zIndex: 3 }} />
      <div style={{ position: "absolute", top: 20, width: 48, height: 1, background: tokens.color.rule, left: isLeft ? "calc(50% - 48px)" : "50%" }} />
      <div style={{ position: "absolute", top: 0, width: 398, left: isLeft ? 0 : 538, display: "flex", flexDirection: isLeft ? "row" : "row-reverse", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: mediaWidth, height: compact ? 102 : 122, padding: 7, background: paper, transform: `rotate(${isLeft ? -1.1 : 1.1}deg)`, boxShadow: tokens.surface.shadowBase }}><ArchiveVisual event={event} /></div>
        <div style={{ width: textWidth, textAlign: isLeft ? "left" : "right", minWidth: 0 }}>
          <div style={{ color: tokens.color.accent, fontFamily: tokens.typography.mono.fontFamily, fontSize: compact ? 14 : 16, fontWeight: 700 }}>{event.date}</div>
          <div style={{ marginTop: 4, color: tokens.color.textStrong, fontFamily: tokens.typography.title.fontFamily, fontSize: compact ? 21 : 24, lineHeight: 1.08, fontWeight: 700, overflowWrap: "anywhere" }}>{event.title}</div>
          {!compact ? <div style={{ marginTop: 6, color: tokens.color.textMuted, fontFamily: tokens.typography.body.fontFamily, fontSize: 15, lineHeight: 1.25 }}>{event.detail}</div> : null}
          <div style={{ marginTop: 7, color: tokens.color.textSoft, fontFamily: tokens.typography.caption.fontFamily, fontSize: 11, lineHeight: 1.2, textTransform: "uppercase" }}>{event.sourceType} / {event.sourceLabel}</div>
        </div>
      </div>
    </div>
  );
};

export const TimelineDocumentaryScene = ({ sceneKey }: { sceneKey: TimelineDocumentaryFixtureKey }) => {
  const frame = useCurrentFrame();
  const fixture = timelineDocumentaryFixtures[sceneKey];
  const layout = resolveVerticalLayout({ platform: "generic", reservedHeader: 0, reservedFooter: 0 });
  const titleFit = fitTypographyToBox({ tokens, role: "headline", text: fixture.title, width: 760, height: 132, maxLines: 3, density: fixture.density, minScale: 0.72 });
  const eventCount = Math.max(3, Math.min(8, fixture.events.length));
  const events = fixture.events.slice(0, eventCount);

  return (
    <AbsoluteFill style={{ background: tokens.color.canvas, color: tokens.color.textStrong, overflow: "hidden", ...texture }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,.2), transparent 18%, transparent 82%, rgba(0,0,0,.2))" }} />
      <div style={{ position: "absolute", left: layout.safe.x, right: layout.safe.x, top: 104, height: 220, ...buildEntranceStyle({ frame, startFrame: 0, durationInFrames: 20, policy: fixture.motionPolicy, preset: "fade-up" }) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${tokens.color.rule}`, paddingBottom: 12 }}>
          <div style={{ fontFamily: tokens.typography.label.fontFamily, fontSize: 14, fontWeight: 750, textTransform: "uppercase", color: tokens.color.accent }}>{fixture.chapter}</div>
          <div style={{ fontFamily: tokens.typography.mono.fontFamily, fontSize: 14, color: tokens.color.textMuted }}>{fixture.dateRange}</div>
        </div>
        <div style={{ marginTop: 18, ...titleFit.style, color: tokens.color.textStrong, maxWidth: 800 }}>{fixture.title}</div>
        <div style={{ position: "absolute", right: 0, bottom: 12, width: 176, color: tokens.color.textMuted, fontFamily: tokens.typography.body.fontFamily, fontSize: 15, lineHeight: 1.32, textAlign: "right" }}>{fixture.summary}</div>
      </div>

      <div style={{ position: "absolute", left: layout.safe.x, right: layout.safe.x, top: 354, bottom: 300 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, transform: "translateX(-50%)", background: `linear-gradient(${tokens.color.accent}, ${withAlpha(tokens.color.accent, 0.25)})` }} />
        {events.map((event, index) => <EventRow key={event.id} event={event} index={index} count={events.length} frame={frame} policy={fixture.motionPolicy} />)}
      </div>

      <div style={{ position: "absolute", left: layout.safe.x, right: layout.safe.x, bottom: 126, minHeight: 132, borderTop: `1px solid ${tokens.color.rule}`, paddingTop: 20, display: "grid", gridTemplateColumns: "176px 1fr 190px", gap: 24, ...buildEntranceStyle({ frame, startFrame: 24, durationInFrames: 20, policy: fixture.motionPolicy, preset: "fade-up" }) }}>
        <div style={{ color: tokens.color.accent, fontFamily: tokens.typography.label.fontFamily, fontSize: 14, fontWeight: 750, textTransform: "uppercase" }}>Documentary finding</div>
        <div style={{ color: paper, fontFamily: tokens.typography.title.fontFamily, fontSize: 25, lineHeight: 1.18 }}>{fixture.thesis}</div>
        <div style={{ color: tokens.color.textSoft, fontFamily: tokens.typography.caption.fontFamily, fontSize: 12, lineHeight: 1.35, textAlign: "right" }}>{fixture.footer}<br />{events.length} dated records / fixture bound</div>
      </div>
    </AbsoluteFill>
  );
};
