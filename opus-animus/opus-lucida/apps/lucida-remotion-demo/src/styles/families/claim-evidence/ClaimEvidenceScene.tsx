import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BoxFrame, Surface, buildEntranceStyle, resolveVerticalLayout, withAlpha } from "../../core";
import { claimEvidenceFixtures } from "../../../../pipeline/fixtures/styles/claim-evidence";
import { claimEvidenceTokens } from "./tokens";
import type { BenchmarkItem, ClaimEvidenceFixture, ClaimEvidenceVariantId, ClaimStatus, EvidenceDirection } from "./types";

const copyStyle = (style: CSSProperties): CSSProperties => ({ overflowWrap: "anywhere", textWrap: "balance", ...style });
const statusColor = (status: ClaimStatus) => status === "supported" ? claimEvidenceTokens.color.success : status === "rejected" ? claimEvidenceTokens.color.danger : status === "mixed" ? claimEvidenceTokens.color.warning : claimEvidenceTokens.color.accent;
const directionColor = (direction: EvidenceDirection) => direction === "supports" ? claimEvidenceTokens.color.success : direction === "weakens" ? claimEvidenceTokens.color.danger : claimEvidenceTokens.color.accent;
const directionLabel = (direction: EvidenceDirection) => direction === "supports" ? "Supports" : direction === "weakens" ? "Weakens" : "Context";

const Label = ({ children, color = claimEvidenceTokens.color.accent }: { children: ReactNode; color?: string }) => (
  <div style={{ color, fontFamily: claimEvidenceTokens.typography.label.fontFamily, fontSize: 14, fontWeight: 760 }}>{children}</div>
);

const EvidenceRow = ({ item, index }: { item: ClaimEvidenceFixture["evidence"][number]; index: number }) => {
  const color = directionColor(item.direction);
  return <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0, 1fr) 38px", gap: 12, padding: "13px 0", borderTop: index === 0 ? "none" : `1px solid ${claimEvidenceTokens.color.rule}` }}>
    <div style={{ color, fontFamily: claimEvidenceTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>{directionLabel(item.direction)}</div>
    <div><div style={{ color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 18, fontWeight: 700 }}>{item.source}</div><div style={copyStyle({ marginTop: 4, color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.caption.fontFamily, fontSize: 15, lineHeight: 1.2, fontWeight: 570 })}>{item.detail}</div></div>
    <div style={{ color, fontFamily: claimEvidenceTokens.typography.mono.fontFamily, fontSize: 16, textAlign: "right" }}>{item.strength}%</div>
  </div>;
};

const EvidenceStack = ({ fixture, title = "Evidence ledger" }: { fixture: ClaimEvidenceFixture; title?: string }) => <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ height: "100%", padding: 20, borderRadius: 8 }}>
  <Label>{title}</Label>
  <div style={{ marginTop: 12 }}>{fixture.evidence.map((item, index) => <EvidenceRow key={`${item.source}-${index}`} item={item} index={index} />)}</div>
</Surface>;

const ClaimProof = ({ fixture }: { fixture: ClaimEvidenceFixture }) => <div style={{ display: "grid", gridTemplateRows: "0.42fr 0.58fr", gap: 20, height: "100%" }}>
  <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ padding: 22, borderRadius: 8, background: withAlpha(statusColor(fixture.claimStatus), 0.1) }}><Label color={statusColor(fixture.claimStatus)}>Claim under review</Label><div style={copyStyle({ marginTop: 14, color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 30, lineHeight: 1.18, fontWeight: 780 })}>{fixture.claim}</div></Surface>
  <EvidenceStack fixture={fixture} title="Proof chain" />
</div>;

const ProCon = ({ fixture }: { fixture: ClaimEvidenceFixture }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, height: "100%" }}>
  <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ padding: 20, borderRadius: 8 }}><Label color={claimEvidenceTokens.color.success}>Case for</Label><div style={{ marginTop: 10 }}>{fixture.evidence.filter((item) => item.direction === "supports").map((item, index) => <EvidenceRow key={`${item.source}-${index}`} item={item} index={index} />)}</div></Surface>
  <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ padding: 20, borderRadius: 8 }}><Label color={claimEvidenceTokens.color.danger}>Case against</Label><div style={{ marginTop: 10 }}>{fixture.evidence.filter((item) => item.direction !== "supports").map((item, index) => <EvidenceRow key={`${item.source}-${index}`} item={item} index={index} />)}</div></Surface>
</div>;

const benchmarkColor = (verdict: BenchmarkItem["verdict"]) => verdict === "passes" ? claimEvidenceTokens.color.success : verdict === "misses" ? claimEvidenceTokens.color.danger : claimEvidenceTokens.color.warning;
const BenchmarkAudit = ({ fixture }: { fixture: ClaimEvidenceFixture }) => <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ height: "100%", padding: 20, borderRadius: 8 }}>
  <Label>Benchmark audit</Label><div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr 0.45fr", gap: 10, paddingBottom: 10, borderBottom: `1px solid ${claimEvidenceTokens.color.rule}`, color: claimEvidenceTokens.color.textSoft, fontFamily: claimEvidenceTokens.typography.label.fontFamily, fontSize: 12 }}><span>Measure</span><span>Observed</span><span>Reference</span><span>Result</span></div>
  <div>{fixture.benchmarks?.map((item) => <div key={item.label} style={{ display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr 0.45fr", gap: 10, alignItems: "center", minHeight: 108, borderBottom: `1px solid ${claimEvidenceTokens.color.rule}` }}><span style={copyStyle({ color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 19, fontWeight: 720 })}>{item.label}</span><span style={{ color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.mono.fontFamily, fontSize: 17 }}>{item.observed}</span><span style={{ color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.mono.fontFamily, fontSize: 17 }}>{item.reference}</span><span style={{ color: benchmarkColor(item.verdict), fontFamily: claimEvidenceTokens.typography.label.fontFamily, fontSize: 12, fontWeight: 760 }}>{item.verdict}</span></div>)}</div>
</Surface>;

const MythReality = ({ fixture }: { fixture: ClaimEvidenceFixture }) => <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 20, height: "100%" }}>
  <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ padding: 22, borderRadius: 8, background: withAlpha(claimEvidenceTokens.color.danger, 0.08) }}><Label color={claimEvidenceTokens.color.danger}>Myth</Label><div style={copyStyle({ marginTop: 16, color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 28, lineHeight: 1.18, fontWeight: 760 })}>{fixture.claim}</div></Surface>
  <Surface tokens={claimEvidenceTokens} elevation="raised" style={{ padding: 22, borderRadius: 8, background: withAlpha(claimEvidenceTokens.color.success, 0.08) }}><Label color={claimEvidenceTokens.color.success}>Reality</Label><div style={copyStyle({ marginTop: 16, color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 28, lineHeight: 1.18, fontWeight: 760 })}>{fixture.counterclaim}</div><div style={{ marginTop: 18 }}>{fixture.evidence.map((item, index) => <EvidenceRow key={`${item.source}-${index}`} item={item} index={index} />)}</div></Surface>
</div>;

const SourceTriangulation = ({ fixture }: { fixture: ClaimEvidenceFixture }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 20, height: "100%" }}>
  {fixture.evidence.map((item, index) => <Surface key={`${item.source}-${index}`} tokens={claimEvidenceTokens} elevation="raised" style={{ gridColumn: index === 2 ? "1 / span 2" : undefined, padding: 20, borderRadius: 8, background: withAlpha(directionColor(item.direction), 0.07) }}><Label color={directionColor(item.direction)}>Source {index + 1}</Label><div style={{ marginTop: 12, color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 23, fontWeight: 740 }}>{item.source}</div><div style={copyStyle({ marginTop: 8, color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.body.fontFamily, fontSize: 17, lineHeight: 1.24, fontWeight: 560 })}>{item.detail}</div></Surface>)}
</div>;

const VariantBody = ({ fixture }: { fixture: ClaimEvidenceFixture }) => fixture.key === "claim-proof" ? <ClaimProof fixture={fixture} /> : fixture.key === "pro-con" ? <ProCon fixture={fixture} /> : fixture.key === "benchmark-audit" ? <BenchmarkAudit fixture={fixture} /> : fixture.key === "myth-reality" ? <MythReality fixture={fixture} /> : <SourceTriangulation fixture={fixture} />;

export const ClaimEvidenceScene = ({ sceneKey, fixture: fixtureOverride }: { sceneKey?: ClaimEvidenceVariantId; fixture?: ClaimEvidenceFixture }) => {
  const frame = useCurrentFrame();
  const fixture = fixtureOverride ?? claimEvidenceFixtures[sceneKey ?? "claim-proof"];
  const layout = resolveVerticalLayout({ platform: "tiktok", contentInset: { top: 12, bottom: 12 }, maxContentWidth: 936 });
  const header = { x: layout.content.x, y: layout.content.y, width: layout.content.width, height: 270 };
  const main = { x: layout.content.x, y: header.y + header.height + 22, width: layout.content.width, height: 860 };
  const verdict = { x: layout.content.x, y: main.y + main.height + 22, width: layout.content.width, height: 144 };
  const confidenceColor = fixture.confidence >= 75 ? claimEvidenceTokens.color.success : fixture.confidence >= 45 ? claimEvidenceTokens.color.warning : claimEvidenceTokens.color.danger;
  return <AbsoluteFill style={{ background: claimEvidenceTokens.color.canvas, color: claimEvidenceTokens.color.textStrong }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.48, backgroundImage: `linear-gradient(90deg, ${withAlpha(claimEvidenceTokens.color.textStrong, 0.035)} 1px, transparent 1px)`, backgroundSize: "48px 100%" }} />
    <BoxFrame box={header}><div style={buildEntranceStyle({ frame, durationInFrames: 16, preset: "fade-up", distance: 14, policy: fixture.motionPolicy })}><div style={{ display: "flex", justifyContent: "space-between", color: claimEvidenceTokens.color.accent, fontFamily: claimEvidenceTokens.typography.label.fontFamily, fontSize: 15, fontWeight: 760 }}><span>{fixture.eyebrow}</span><span>DRAFT / 9:16</span></div><div style={copyStyle({ marginTop: 16, color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.headline.fontFamily, fontSize: 43, lineHeight: 1.08, fontWeight: 790 })}>{fixture.title}</div><div style={copyStyle({ marginTop: 13, maxWidth: 850, color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.caption.fontFamily, fontSize: 17, lineHeight: 1.25, fontWeight: 580 })}>{fixture.summary}</div></div></BoxFrame>
    <BoxFrame box={main}><div style={{ height: "100%", ...buildEntranceStyle({ frame, durationInFrames: 16, delayFrames: 5, preset: "fade-up", distance: 10, policy: fixture.motionPolicy }) }}><VariantBody fixture={fixture} /></div></BoxFrame>
    <BoxFrame box={verdict}><Surface tokens={claimEvidenceTokens} style={{ ...buildEntranceStyle({ frame, durationInFrames: 14, delayFrames: 10, preset: "fade-up", distance: 8, policy: fixture.motionPolicy }), height: "100%", padding: 18, borderRadius: 8, display: "grid", gridTemplateColumns: "150px minmax(0, 1fr) 110px", gap: 18, alignItems: "center" }}><div><Label color={confidenceColor}>Confidence</Label><div style={{ marginTop: 7, color: confidenceColor, fontFamily: claimEvidenceTokens.typography.mono.fontFamily, fontSize: 31, fontWeight: 760 }}>{fixture.confidence}%</div></div><div><div style={copyStyle({ color: claimEvidenceTokens.color.textStrong, fontFamily: claimEvidenceTokens.typography.title.fontFamily, fontSize: 21, lineHeight: 1.15, fontWeight: 740 })}>{fixture.verdict}</div><div style={copyStyle({ marginTop: 5, color: claimEvidenceTokens.color.textMuted, fontFamily: claimEvidenceTokens.typography.caption.fontFamily, fontSize: 14, lineHeight: 1.18, fontWeight: 560 })}>{fixture.caption}</div></div><div style={{ height: 8, borderRadius: 4, background: claimEvidenceTokens.color.rule, overflow: "hidden" }}><div style={{ width: `${fixture.confidence}%`, height: "100%", background: confidenceColor }} /></div></Surface></BoxFrame>
  </AbsoluteFill>;
};
