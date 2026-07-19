import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BoxFrame, Surface, buildEntranceStyle, fitTypographyToBox, resolveVerticalLayout, withAlpha } from "../../core";
import { terminalCommandCenterFixtures } from "../../../../pipeline/fixtures/styles/terminal-command-center";
import { terminalCommandCenterTokens } from "./tokens";
import type { TerminalCommandCenterFixture, TerminalCommandCenterVariantId, TerminalLine, TerminalTone } from "./types";

const copyStyle = (style: CSSProperties): CSSProperties => ({ overflowWrap: "anywhere", textWrap: "balance", ...style });

const toneColor = (tone: TerminalTone | undefined, crt = false) => {
  if (tone === "success") return terminalCommandCenterTokens.color.success;
  if (tone === "warning") return terminalCommandCenterTokens.color.warning;
  if (tone === "danger") return terminalCommandCenterTokens.color.danger;
  if (tone === "accent") return crt ? terminalCommandCenterTokens.color.warning : terminalCommandCenterTokens.color.accent;
  return tone === "muted" ? terminalCommandCenterTokens.color.textMuted : terminalCommandCenterTokens.color.textStrong;
};

const TerminalChrome = ({ fixture, children }: { fixture: TerminalCommandCenterFixture; children: React.ReactNode }) => {
  const crt = fixture.layout === "crt";
  const accent = toneColor("accent", crt);
  return <Surface tokens={terminalCommandCenterTokens} elevation="raised" style={{ height: "100%", padding: 18, borderRadius: 8, overflow: "hidden", background: crt ? "#11100B" : terminalCommandCenterTokens.color.surface }}>
    {crt && <div style={{ position: "absolute", inset: 0, opacity: 0.11, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 5px, rgba(210, 180, 122, 0.45) 6px)" }} />}
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, paddingBottom: 14, borderBottom: `1px solid ${terminalCommandCenterTokens.color.rule}` }}>
      {[terminalCommandCenterTokens.color.danger, terminalCommandCenterTokens.color.warning, terminalCommandCenterTokens.color.success].map((color) => <span key={color} style={{ width: 9, height: 9, borderRadius: 99, background: color }} />)}
      <span style={{ marginLeft: 8, minWidth: 0, color: terminalCommandCenterTokens.color.textSoft, fontFamily: terminalCommandCenterTokens.typography.mono.fontFamily, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fixture.path}</span>
      <span style={{ marginLeft: "auto", color: accent, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>{fixture.layout === "runtime" ? "RUNNING" : fixture.layout === "monitor" ? "HEALTHY" : "READY"}</span>
    </div>
    <div style={{ position: "relative", height: "calc(100% - 42px)" }}>{children}</div>
  </Surface>;
};

const TerminalTranscript = ({ fixture, lines = fixture.lines, compact = false }: { fixture: TerminalCommandCenterFixture; lines?: TerminalLine[]; compact?: boolean }) => {
  const crt = fixture.layout === "crt";
  const accent = toneColor("accent", crt);
  return <div style={{ marginTop: compact ? 14 : 22, display: "grid", gap: compact ? 9 : 14 }}>
    <div style={{ color: accent, fontFamily: terminalCommandCenterTokens.typography.mono.fontFamily, fontSize: compact ? 16 : 19, fontWeight: 650, overflowWrap: "anywhere" }}><span style={{ color: terminalCommandCenterTokens.color.textSoft }}>$ </span>{fixture.command}<span style={{ marginLeft: 4, display: "inline-block", width: 9, height: compact ? 16 : 18, verticalAlign: "-3px", background: accent, opacity: 0.78 }} /></div>
    {lines.map((line, index) => <div key={`${line.text}-${index}`} style={{ color: toneColor(line.tone, crt), paddingLeft: 18, borderLeft: `2px solid ${line.tone ? toneColor(line.tone, crt) : "transparent"}`, fontFamily: terminalCommandCenterTokens.typography.mono.fontFamily, fontSize: compact ? 15 : 18, lineHeight: 1.24, overflowWrap: "anywhere" }}>{line.text}</div>)}
  </div>;
};

const TaskRows = ({ fixture, frame }: { fixture: TerminalCommandCenterFixture; frame: number }) => <div style={{ display: "grid", gap: 10 }}>
  {(fixture.tasks ?? []).map((task, index) => {
    const tone: TerminalTone = task.state === "complete" ? "success" : task.state === "blocked" ? "danger" : task.state === "active" ? "accent" : "muted";
    return <div key={task.label} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 6 + index * 3, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), display: "grid", gridTemplateColumns: "100px minmax(0, 1fr)", gap: 12, paddingTop: 11, borderTop: `1px solid ${terminalCommandCenterTokens.color.rule}` }}>
      <div style={{ color: toneColor(tone), fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>{task.state}</div>
      <div><div style={copyStyle({ color: terminalCommandCenterTokens.color.textStrong, fontFamily: terminalCommandCenterTokens.typography.mono.fontFamily, fontSize: 16, fontWeight: 650 })}>{task.label}</div><div style={copyStyle({ marginTop: 4, color: terminalCommandCenterTokens.color.textMuted, fontFamily: terminalCommandCenterTokens.typography.caption.fontFamily, fontSize: 14, lineHeight: 1.2 })}>{task.detail}</div></div>
    </div>;
  })}
</div>;

const MetricStrip = ({ fixture }: { fixture: TerminalCommandCenterFixture }) => <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
  {(fixture.metrics ?? []).map((metric) => <div key={metric.label} style={{ padding: 12, border: `1px solid ${terminalCommandCenterTokens.color.rule}`, background: terminalCommandCenterTokens.color.canvasRaised }}><div style={{ color: terminalCommandCenterTokens.color.textSoft, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>{metric.label}</div><div style={{ marginTop: 7, color: toneColor(metric.tone), fontFamily: terminalCommandCenterTokens.typography.mono.fontFamily, fontSize: 21, fontWeight: 760 }}>{metric.value}</div></div>)}
</div>;

const MainPanel = ({ fixture, frame }: { fixture: TerminalCommandCenterFixture; frame: number }) => {
  if (fixture.layout === "runtime") return <TerminalChrome fixture={fixture}><div style={{ marginTop: 18, color: terminalCommandCenterTokens.color.accent, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 13, fontWeight: 760 }}>Task queue / ownership visible</div><div style={{ marginTop: 16 }}><TaskRows fixture={fixture} frame={frame} /></div></TerminalChrome>;
  if (fixture.layout === "monitor") return <TerminalChrome fixture={fixture}><div style={{ marginTop: 18 }}><MetricStrip fixture={fixture} /><TerminalTranscript fixture={fixture} compact /></div></TerminalChrome>;
  if (fixture.layout === "deck") return <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.75fr)", gap: 18, height: "100%" }}><TerminalChrome fixture={fixture}><TerminalTranscript fixture={fixture} compact /></TerminalChrome><Surface tokens={terminalCommandCenterTokens} elevation="raised" style={{ height: "100%", padding: 16, borderRadius: 8 }}><div style={{ color: terminalCommandCenterTokens.color.warning, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>Attached modules</div><div style={{ marginTop: 15 }}><TaskRows fixture={fixture} frame={frame} /></div></Surface></div>;
  return <TerminalChrome fixture={fixture}><TerminalTranscript fixture={fixture} /></TerminalChrome>;
};

export const TerminalCommandCenterScene = ({ sceneKey, fixture: fixtureOverride }: { sceneKey?: TerminalCommandCenterVariantId; fixture?: TerminalCommandCenterFixture }) => {
  const frame = useCurrentFrame();
  const fixture = fixtureOverride ?? terminalCommandCenterFixtures[sceneKey ?? "clean-cli"];
  const layout = resolveVerticalLayout({ platform: "tiktok", contentInset: { top: 12, bottom: 12 }, maxContentWidth: 936 });
  const header = { x: layout.content.x, y: layout.content.y, width: layout.content.width, height: 260 };
  const main = { x: layout.content.x, y: header.y + header.height + 24, width: layout.content.width, height: 744 };
  const caption = { x: layout.content.x, y: main.y + main.height + 24, width: layout.content.width, height: 168 };
  const titleFit = fitTypographyToBox({ tokens: terminalCommandCenterTokens, role: "headline", text: fixture.title, width: header.width, height: 112, maxLines: 3, density: fixture.density, minScale: 0.72 });
  const accent = fixture.layout === "crt" ? terminalCommandCenterTokens.color.warning : terminalCommandCenterTokens.color.accent;
  return <AbsoluteFill style={{ background: terminalCommandCenterTokens.color.canvas, color: terminalCommandCenterTokens.color.textStrong }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.42, backgroundImage: `radial-gradient(${withAlpha(accent, 0.1)} 1px, transparent 1px)`, backgroundSize: "26px 26px" }} />
    <BoxFrame box={header}><div style={buildEntranceStyle({ frame, durationInFrames: 16, preset: "fade-up", distance: 14, policy: fixture.motionPolicy })}><div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: accent, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}><span>{fixture.eyebrow}</span><span>TERMINAL / 9:16</span></div><div style={copyStyle({ marginTop: 16, color: terminalCommandCenterTokens.color.textStrong, fontFamily: titleFit.style.fontFamily, fontSize: titleFit.style.fontSize, lineHeight: titleFit.style.lineHeight, fontWeight: titleFit.style.fontWeight })}>{fixture.title}</div><div style={copyStyle({ marginTop: 13, maxWidth: 840, color: terminalCommandCenterTokens.color.textMuted, fontFamily: terminalCommandCenterTokens.typography.caption.fontFamily, fontSize: 16, lineHeight: 1.25, fontWeight: 570 })}>{fixture.summary}</div></div></BoxFrame>
    <BoxFrame box={main}><MainPanel fixture={fixture} frame={frame} /></BoxFrame>
    <BoxFrame box={caption}><Surface tokens={terminalCommandCenterTokens} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 8, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), height: "100%", padding: 18, borderRadius: 8, display: "grid", gridTemplateColumns: "124px minmax(0, 1fr)", gap: 18, alignItems: "start" }}><div style={{ color: terminalCommandCenterTokens.color.warning, fontFamily: terminalCommandCenterTokens.typography.label.fontFamily, fontSize: 13, fontWeight: 760 }}>Operational note</div><div style={copyStyle({ color: terminalCommandCenterTokens.color.textStrong, fontFamily: terminalCommandCenterTokens.typography.body.fontFamily, fontSize: 18, lineHeight: 1.26, fontWeight: 600 })}>{fixture.caption}</div></Surface></BoxFrame>
  </AbsoluteFill>;
};
