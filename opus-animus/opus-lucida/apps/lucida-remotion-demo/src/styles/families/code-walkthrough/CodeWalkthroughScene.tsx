import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
  Surface,
  buildEntranceStyle,
  fitTypographyToBox,
  resolveVerticalLayout,
  withAlpha,
} from "../../core";
import { codeWalkthroughFixtures } from "../../../../pipeline/fixtures/styles/code-walkthrough";
import { codeWalkthroughTokens } from "./tokens";
import type { CodeLineTone, CodeWalkthroughFixture, CodeWalkthroughVariantId } from "./types";

const lineHeight = 32;

const copyStyle = (style: CSSProperties): CSSProperties => ({
  overflowWrap: "anywhere",
  textWrap: "balance",
  ...style,
});

const toneColor = (tone: CodeLineTone | undefined) => {
  if (tone === "added") return codeWalkthroughTokens.color.success;
  if (tone === "removed") return codeWalkthroughTokens.color.danger;
  if (tone === "warning") return codeWalkthroughTokens.color.warning;
  if (tone === "active") return codeWalkthroughTokens.color.accent;
  return codeWalkthroughTokens.color.textStrong;
};

const diffMarker = (tone: CodeLineTone | undefined) =>
  tone === "added" ? "+" : tone === "removed" ? "-" : tone === "active" ? ">" : " ";

const CodeRows = ({ fixture, compact = false }: { fixture: CodeWalkthroughFixture; compact?: boolean }) => (
  <div style={{ display: "grid", gap: 2 }}>
    {fixture.code.map((line, index) => {
      const tone = line.tone ?? "context";
      const background = tone === "added"
        ? withAlpha(codeWalkthroughTokens.color.success, 0.12)
        : tone === "removed"
          ? withAlpha(codeWalkthroughTokens.color.danger, 0.12)
          : tone === "active"
            ? withAlpha(codeWalkthroughTokens.color.accent, 0.14)
            : tone === "warning"
              ? withAlpha(codeWalkthroughTokens.color.warning, 0.1)
              : "transparent";
      return (
        <div key={`${line.value}-${index}`} style={{
          display: "grid", gridTemplateColumns: "28px 44px minmax(0, 1fr)", minHeight: compact ? 28 : lineHeight,
          alignItems: "center", background, borderLeft: `2px solid ${tone === "context" ? "transparent" : toneColor(tone)}`,
        }}>
          <span style={{ color: toneColor(tone), textAlign: "center", fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: compact ? 15 : 17 }}>{diffMarker(tone)}</span>
          <span style={{ color: codeWalkthroughTokens.color.textSoft, textAlign: "right", paddingRight: 12, fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: compact ? 14 : 16 }}>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ color: toneColor(tone), whiteSpace: "pre", overflow: "hidden", textOverflow: "clip", fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: compact ? 15 : 17, lineHeight: 1.2 }}>{line.value}</span>
        </div>
      );
    })}
  </div>
);

const SideRail = ({ fixture, frame }: { fixture: CodeWalkthroughFixture; frame: number }) => (
  <Surface tokens={codeWalkthroughTokens} elevation="raised" style={{ height: "100%", padding: 18, borderRadius: 8 }}>
    <div style={{ color: codeWalkthroughTokens.color.accent, fontFamily: codeWalkthroughTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}>{fixture.sideLabel}</div>
    <div style={copyStyle({ marginTop: 10, color: codeWalkthroughTokens.color.textStrong, fontFamily: codeWalkthroughTokens.typography.title.fontFamily, fontSize: 25, lineHeight: 1.16, fontWeight: 760 })}>{fixture.sideTitle}</div>
    <div style={copyStyle({ marginTop: 12, color: codeWalkthroughTokens.color.textMuted, fontFamily: codeWalkthroughTokens.typography.caption.fontFamily, fontSize: 16, lineHeight: 1.24, fontWeight: 580 })}>{fixture.sideDetail}</div>
    <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
      {fixture.steps.map((step, index) => {
        const accent = step.state === "blocked" ? codeWalkthroughTokens.color.danger : step.state === "active" ? codeWalkthroughTokens.color.warning : codeWalkthroughTokens.color.success;
        return <div key={step.label} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: index * 3 + 6, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), paddingTop: 10, borderTop: `1px solid ${codeWalkthroughTokens.color.rule}` }}>
          <div style={{ color: accent, fontFamily: codeWalkthroughTokens.typography.label.fontFamily, fontSize: 13, fontWeight: 760 }}>{step.state ?? "ready"} / {step.label}</div>
          <div style={copyStyle({ marginTop: 5, color: codeWalkthroughTokens.color.textMuted, fontFamily: codeWalkthroughTokens.typography.caption.fontFamily, fontSize: 15, lineHeight: 1.2, fontWeight: 580 })}>{step.detail}</div>
        </div>;
      })}
    </div>
  </Surface>
);

const TerminalPanel = ({ lines }: { lines: string[] }) => (
  <Surface tokens={codeWalkthroughTokens} style={{ height: "100%", padding: 18, borderRadius: 8, background: "#0B0E12" }}>
    <div style={{ display: "flex", gap: 7, paddingBottom: 16, borderBottom: `1px solid ${codeWalkthroughTokens.color.rule}` }}>
      {[codeWalkthroughTokens.color.danger, codeWalkthroughTokens.color.warning, codeWalkthroughTokens.color.success].map((color) => <span key={color} style={{ width: 9, height: 9, borderRadius: 99, background: color }} />)}
      <span style={{ marginLeft: 8, color: codeWalkthroughTokens.color.textSoft, fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: 14 }}>trace terminal</span>
    </div>
    <div style={{ marginTop: 18, display: "grid", gap: 13 }}>
      {lines.map((line, index) => <div key={`${line}-${index}`} style={{ color: index === lines.length - 1 ? codeWalkthroughTokens.color.success : codeWalkthroughTokens.color.textMuted, fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: 16, lineHeight: 1.24, overflowWrap: "anywhere" }}><span style={{ color: codeWalkthroughTokens.color.accent }}>$ </span>{line}</div>)}
    </div>
  </Surface>
);

export const CodeWalkthroughScene = ({ sceneKey, fixture: fixtureOverride }: { sceneKey?: CodeWalkthroughVariantId; fixture?: CodeWalkthroughFixture }) => {
  const frame = useCurrentFrame();
  const fixture = fixtureOverride ?? codeWalkthroughFixtures[sceneKey ?? "code-focus"];
  const layout = resolveVerticalLayout({ platform: "tiktok", contentInset: { top: 12, bottom: 12 }, maxContentWidth: 936 });
  const header = { x: layout.content.x, y: layout.content.y, width: layout.content.width, height: 260 };
  const main = { x: layout.content.x, y: header.y + header.height + 24, width: layout.content.width, height: 744 };
  const caption = { x: layout.content.x, y: main.y + main.height + 24, width: layout.content.width, height: 168 };
  const titleFit = fitTypographyToBox({ tokens: codeWalkthroughTokens, role: "headline", text: fixture.title, width: header.width, height: 112, maxLines: 3, density: fixture.density, minScale: 0.72 });
  const splitTerminal = fixture.key === "terminal-code-split";
  const focusedCode = fixture.key === "code-focus" || fixture.key === "diff-review";
  const codeWidth = focusedCode ? main.width * 0.66 : main.width * (splitTerminal ? 0.52 : 0.6);
  const railX = main.x + codeWidth + 20;
  const railWidth = main.width - codeWidth - 20;

  return <AbsoluteFill style={{ background: codeWalkthroughTokens.color.canvas, color: codeWalkthroughTokens.color.textStrong }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.62, backgroundImage: `linear-gradient(${withAlpha(codeWalkthroughTokens.color.textStrong, 0.035)} 1px, transparent 1px)`, backgroundSize: "100% 48px" }} />
    <BoxFrame box={header}>
      <div style={buildEntranceStyle({ frame, durationInFrames: 16, preset: "fade-up", distance: 14, policy: fixture.motionPolicy })}>
        <div style={{ display: "flex", justifyContent: "space-between", color: codeWalkthroughTokens.color.accent, fontFamily: codeWalkthroughTokens.typography.label.fontFamily, fontSize: 15, fontWeight: 760 }}><span>{fixture.eyebrow}</span><span>DRAFT / 9:16</span></div>
        <div style={copyStyle({ marginTop: 16, color: codeWalkthroughTokens.color.textStrong, fontFamily: titleFit.style.fontFamily, fontSize: titleFit.style.fontSize, lineHeight: titleFit.style.lineHeight, fontWeight: titleFit.style.fontWeight })}>{fixture.title}</div>
        <div style={copyStyle({ marginTop: 13, maxWidth: 820, color: codeWalkthroughTokens.color.textMuted, fontFamily: codeWalkthroughTokens.typography.caption.fontFamily, fontSize: 17, lineHeight: 1.25, fontWeight: 580 })}>{fixture.summary}</div>
      </div>
    </BoxFrame>
    <BoxFrame box={main}>
      <div style={{ display: "flex", gap: 20, height: "100%" }}>
        {splitTerminal ? <div style={{ width: codeWidth, minWidth: 0 }}><TerminalPanel lines={fixture.terminal ?? []} /></div> : <Surface tokens={codeWalkthroughTokens} elevation="raised" style={{ width: codeWidth, minWidth: 0, height: "100%", padding: 18, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 14, borderBottom: `1px solid ${codeWalkthroughTokens.color.rule}`, color: codeWalkthroughTokens.color.textSoft, fontFamily: codeWalkthroughTokens.typography.mono.fontFamily, fontSize: 14 }}><span>{fixture.file.path}</span><span>{fixture.file.language} / {fixture.file.branch}</span></div>
          <div style={{ marginTop: 16 }}><CodeRows fixture={fixture} /></div>
        </Surface>}
        <div style={{ position: "absolute", left: railX - main.x, top: 0, width: railWidth, height: "100%" }}>
          {splitTerminal ? <Surface tokens={codeWalkthroughTokens} elevation="raised" style={{ height: "100%", padding: 18, borderRadius: 8 }}><div style={{ color: codeWalkthroughTokens.color.accent, fontFamily: codeWalkthroughTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}>{fixture.file.path}</div><div style={{ marginTop: 16 }}><CodeRows fixture={fixture} compact /></div><div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${codeWalkthroughTokens.color.rule}`, color: codeWalkthroughTokens.color.textMuted, fontFamily: codeWalkthroughTokens.typography.caption.fontFamily, fontSize: 15, lineHeight: 1.2 }}>{fixture.sideDetail}</div></Surface> : <SideRail fixture={fixture} frame={frame} />}
        </div>
      </div>
    </BoxFrame>
    <BoxFrame box={caption}><Surface tokens={codeWalkthroughTokens} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 8, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), height: "100%", padding: 18, borderRadius: 8, display: "grid", gridTemplateColumns: "124px minmax(0, 1fr)", gap: 18, alignItems: "start" }}><div style={{ color: codeWalkthroughTokens.color.warning, fontFamily: codeWalkthroughTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}>Caption safe</div><div style={copyStyle({ color: codeWalkthroughTokens.color.textStrong, fontFamily: codeWalkthroughTokens.typography.body.fontFamily, fontSize: 20, lineHeight: 1.28, fontWeight: 620 })}>{fixture.caption}</div></Surface></BoxFrame>
  </AbsoluteFill>;
};
