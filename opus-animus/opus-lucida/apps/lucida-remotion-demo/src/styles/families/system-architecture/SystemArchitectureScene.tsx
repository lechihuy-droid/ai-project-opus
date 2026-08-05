import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BoxFrame, Surface, buildEntranceStyle, fitTypographyToBox, resolveVerticalLayout, withAlpha } from "../../core";
import { systemArchitectureFixtures } from "../../../../pipeline/fixtures/styles/system-architecture";
import { systemArchitectureTokens } from "./tokens";
import type { ArchitectureNode, ArchitectureTone, SystemArchitectureFixture, SystemArchitectureVariantId } from "./types";

const copyStyle = (style: CSSProperties): CSSProperties => ({
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  whiteSpace: "normal",
  textWrap: "balance",
  ...style,
});

const ARCHITECTURE_NODE = Object.freeze({ width: 182, height: 86 });

const toneColor = (tone: ArchitectureTone | undefined) => {
  if (tone === "success") return systemArchitectureTokens.color.success;
  if (tone === "warning") return systemArchitectureTokens.color.warning;
  if (tone === "danger") return systemArchitectureTokens.color.danger;
  return tone === "accent" ? systemArchitectureTokens.color.accent : systemArchitectureTokens.color.textMuted;
};

const ArchitectureCanvas = ({ fixture, frame }: { fixture: SystemArchitectureFixture; frame: number }) => {
  const byId = new Map(fixture.nodes.map((node) => [node.id, node]));
  const nodePoint = (node: ArchitectureNode) => ({ x: node.x * 9.36, y: node.y * 7.8 });
  return <Surface tokens={systemArchitectureTokens} elevation="raised" padding={0} style={{ width: "100%", height: "100%", boxSizing: "border-box", position: "relative", overflow: "hidden", borderRadius: 8, background: systemArchitectureTokens.color.surface }}>
    <svg aria-hidden="true" viewBox="0 0 936 780" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs><marker id="architecture-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={systemArchitectureTokens.color.accent} /></marker></defs>
      {fixture.edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        const start = nodePoint(from);
        const end = nodePoint(to);
        return <line key={`${edge.from}-${edge.to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={withAlpha(systemArchitectureTokens.color.accent, 0.64)} strokeWidth="3" markerEnd="url(#architecture-arrow)" />;
      })}
    </svg>
    {fixture.edges.map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!edge.label || !from || !to) return null;
      return <span key={`${edge.from}-${edge.to}-label`} style={{ position: "absolute", left: `${(from.x + to.x) / 2}%`, top: `${(from.y + to.y) / 2}%`, transform: "translate(-50%, -50%)", padding: "3px 6px", borderRadius: 4, color: systemArchitectureTokens.color.textSoft, background: systemArchitectureTokens.color.canvas, fontFamily: systemArchitectureTokens.typography.label.fontFamily, fontSize: 11, fontWeight: 760 }}>{edge.label}</span>;
    })}
    {fixture.nodes.map((node, index) => <div key={node.id} style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, width: 182, transform: "translate(-50%, -50%)" }}>
      <div style={buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 5 + index * 3, preset: "scale-up", distance: 8, policy: fixture.motionPolicy })}>
        <Surface tokens={systemArchitectureTokens} style={{ width: ARCHITECTURE_NODE.width, height: ARCHITECTURE_NODE.height, boxSizing: "border-box", padding: "12px 14px", borderRadius: 8, borderLeft: `3px solid ${toneColor(node.tone)}`, background: systemArchitectureTokens.color.surfaceElevated }}>
          <div style={copyStyle({ color: toneColor(node.tone), fontFamily: systemArchitectureTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 })}>{node.label}</div>
          <div style={copyStyle({ marginTop: 7, color: systemArchitectureTokens.color.textStrong, fontFamily: systemArchitectureTokens.typography.caption.fontFamily, fontSize: 14, lineHeight: 1.18, fontWeight: 620 })}>{node.detail}</div>
        </Surface>
      </div>
    </div>)}
  </Surface>;
};

export const SystemArchitectureScene = ({ sceneKey, fixture: fixtureOverride }: { sceneKey?: SystemArchitectureVariantId; fixture?: SystemArchitectureFixture }) => {
  const frame = useCurrentFrame();
  const fixture = fixtureOverride ?? systemArchitectureFixtures[sceneKey ?? "layered-stack"];
  const layout = resolveVerticalLayout({ platform: "tiktok", contentInset: { top: 12, bottom: 12 }, maxContentWidth: 936 });
  const header = { x: layout.content.x, y: layout.content.y, width: layout.content.width, height: 260 };
  const main = { x: layout.content.x, y: header.y + header.height + 24, width: layout.content.width, height: 780 };
  const caption = { x: layout.content.x, y: main.y + main.height + 24, width: layout.content.width, height: 168 };
  const titleFit = fitTypographyToBox({ tokens: systemArchitectureTokens, role: "headline", text: fixture.title, width: header.width, height: 112, maxLines: 3, density: fixture.density, minScale: 0.72 });
  return <AbsoluteFill style={{ background: systemArchitectureTokens.color.canvas, color: systemArchitectureTokens.color.textStrong, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.55, backgroundImage: `radial-gradient(${withAlpha(systemArchitectureTokens.color.textStrong, 0.12)} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
    <BoxFrame box={header}><div style={buildEntranceStyle({ frame, durationInFrames: 16, preset: "fade-up", distance: 14, policy: fixture.motionPolicy })}>
      <div style={{ display: "flex", justifyContent: "space-between", color: systemArchitectureTokens.color.accent, fontFamily: systemArchitectureTokens.typography.label.fontFamily, fontSize: 15, fontWeight: 760 }}><span>{fixture.eyebrow}</span><span>DRAFT / 9:16</span></div>
      <div style={copyStyle({ marginTop: 16, color: systemArchitectureTokens.color.textStrong, fontFamily: titleFit.style.fontFamily, fontSize: titleFit.style.fontSize, lineHeight: titleFit.style.lineHeight, fontWeight: titleFit.style.fontWeight })}>{fixture.title}</div>
      <div style={copyStyle({ marginTop: 13, maxWidth: 820, color: systemArchitectureTokens.color.textMuted, fontFamily: systemArchitectureTokens.typography.caption.fontFamily, fontSize: 17, lineHeight: 1.25, fontWeight: 580 })}>{fixture.summary}</div>
    </div></BoxFrame>
    <BoxFrame box={main}><ArchitectureCanvas fixture={fixture} frame={frame} /></BoxFrame>
    <BoxFrame box={caption}><Surface tokens={systemArchitectureTokens} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 8, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), height: "100%", padding: 18, borderRadius: 8, display: "grid", gridTemplateColumns: "124px minmax(0, 1fr)", gap: 18, alignItems: "start" }}><div style={{ color: systemArchitectureTokens.color.warning, fontFamily: systemArchitectureTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}>Caption safe</div><div style={copyStyle({ color: systemArchitectureTokens.color.textStrong, fontFamily: systemArchitectureTokens.typography.body.fontFamily, fontSize: 20, lineHeight: 1.28, fontWeight: 620 })}>{fixture.caption}</div></Surface></BoxFrame>
  </AbsoluteFill>;
};
