import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BoxFrame,
  Surface,
  buildEntranceStyle,
  buildStaggeredEntrance,
  fitTypographyToBox,
  makeBox,
  resolveColumns,
  resolveTonePalette,
  resolveVerticalLayout,
  spanColumns,
  withAlpha,
} from "../../core";
import {
  technicalEditorialFixtures,
  type TechnicalEditorialFixtureKey,
} from "../../../../pipeline/fixtures/styles/technical-editorial";
import { technicalEditorialTokens } from "./tokens";
import type {
  TechnicalEditorialAnnotation,
  TechnicalEditorialFixture,
  TechnicalEditorialMetric,
  TechnicalEditorialStep,
} from "./types";

const headerHeight = 308;
const summaryHeight = 178;
const rowGap = 26;

const drawText = (style: CSSProperties): CSSProperties => ({
  textWrap: "balance",
  overflowWrap: "anywhere",
  ...style,
});

const drawCodeText = (style: CSSProperties): CSSProperties => ({
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "normal",
  ...style,
});

const RuleMatrix = () => {
  const gridColor = withAlpha(technicalEditorialTokens.color.textStrong, 0.045);
  const ruleColor = withAlpha(technicalEditorialTokens.color.accent, 0.09);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            `linear-gradient(to right, ${gridColor} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "72px 72px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            `linear-gradient(90deg, transparent 0%, ${ruleColor} 25%, transparent 60%)`,
            `linear-gradient(180deg, ${withAlpha(technicalEditorialTokens.color.canvasRaised, 0)} 0%, ${withAlpha(technicalEditorialTokens.color.canvasRaised, 0.6)} 100%)`,
          ].join(", "),
        }}
      />
    </>
  );
};

const SectionLabel = ({
  children,
  tone = "accent",
}: {
  children: string;
  tone?: "accent" | "success" | "warning";
}) => {
  const accent =
    tone === "success"
      ? technicalEditorialTokens.color.success
      : tone === "warning"
        ? technicalEditorialTokens.color.warning
        : technicalEditorialTokens.color.accent;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color: accent,
        fontFamily: technicalEditorialTokens.typography.label.fontFamily,
        fontSize: technicalEditorialTokens.typography.label.fontSize,
        lineHeight: technicalEditorialTokens.typography.label.lineHeight,
        fontWeight: technicalEditorialTokens.typography.label.fontWeight,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: accent,
          boxShadow: `0 0 0 5px ${withAlpha(accent, 0.12)}`,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
};

const AnnotationCard = ({
  annotation,
  index,
  frame,
  motionPolicy,
  compact = false,
}: {
  annotation: TechnicalEditorialAnnotation;
  index: number;
  frame: number;
  motionPolicy: TechnicalEditorialFixture["motionPolicy"];
  compact?: boolean;
}) => {
  const palette = resolveTonePalette(
    technicalEditorialTokens,
    annotation.tone ?? "neutral",
  );
  const labelSize = compact
    ? 15
    : technicalEditorialTokens.typography.label.fontSize;
  const valueSize = compact ? 18 : 22;
  const noteSize = compact ? 13 : 15;

  return (
    <div
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: technicalEditorialTokens.motion.normalFrames,
            preset: "fade-right",
            distance: technicalEditorialTokens.motion.distanceSm,
            policy: motionPolicy,
          },
          3,
        ),
        paddingBottom: compact ? 8 : 12,
        borderBottom: `1px solid ${withAlpha(palette.border, 0.72)}`,
      }}
    >
      <div
        style={{
          color: palette.accent,
          fontFamily: technicalEditorialTokens.typography.label.fontFamily,
          fontSize: labelSize,
          lineHeight: technicalEditorialTokens.typography.label.lineHeight,
          fontWeight: technicalEditorialTokens.typography.label.fontWeight,
        }}
      >
        {annotation.label}
      </div>
      <div
        style={drawText({
          marginTop: compact ? 7 : 10,
          color: palette.text,
          fontFamily: technicalEditorialTokens.typography.title.fontFamily,
          fontSize: valueSize,
          lineHeight: compact ? 1.14 : 1.18,
          fontWeight: 760,
        })}
      >
        {annotation.value}
      </div>
      {annotation.note ? (
        <div
          style={drawText({
            marginTop: compact ? 6 : 8,
            color: palette.mutedText,
            fontFamily: technicalEditorialTokens.typography.caption.fontFamily,
            fontSize: noteSize,
            lineHeight: compact ? 1.16 : 1.2,
            fontWeight: technicalEditorialTokens.typography.caption.fontWeight,
          })}
        >
          {annotation.note}
        </div>
      ) : null}
    </div>
  );
};

const MetricCard = ({
  metric,
  index,
  frame,
  motionPolicy,
}: {
  metric: TechnicalEditorialMetric;
  index: number;
  frame: number;
  motionPolicy: TechnicalEditorialFixture["motionPolicy"];
}) => {
  const palette = resolveTonePalette(
    technicalEditorialTokens,
    metric.tone ?? "neutral",
  );

  return (
    <Surface
      tokens={technicalEditorialTokens}
      tone={metric.tone ?? "neutral"}
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: technicalEditorialTokens.motion.fastFrames + 8,
            preset: "fade-up",
            distance: technicalEditorialTokens.motion.distanceSm,
            policy: motionPolicy,
          },
          4,
        ),
        padding: 16,
        borderRadius: technicalEditorialTokens.radius.md,
        minHeight: 132,
      }}
    >
      <div
        style={{
          color: palette.mutedText,
          fontFamily: technicalEditorialTokens.typography.label.fontFamily,
          fontSize: 15,
          lineHeight: 1.16,
          fontWeight: 760,
        }}
      >
        {metric.label}
      </div>
      <div
        style={{
          marginTop: 14,
          color: palette.text,
          fontFamily: technicalEditorialTokens.typography.headline.fontFamily,
          fontSize: 30,
          lineHeight: 1.08,
          fontWeight: 820,
        }}
      >
        {metric.value}
      </div>
      <div
        style={drawText({
          marginTop: 10,
          color: palette.mutedText,
          fontFamily: technicalEditorialTokens.typography.caption.fontFamily,
          fontSize: 15,
          lineHeight: 1.18,
          fontWeight: technicalEditorialTokens.typography.caption.fontWeight,
        })}
      >
        {metric.detail}
      </div>
    </Surface>
  );
};

const DiagramPanel = ({
  fixture,
  frame,
}: {
  fixture: TechnicalEditorialFixture;
  frame: number;
}) => {
  const panelStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    padding: technicalEditorialTokens.spacing.lg,
    borderRadius: technicalEditorialTokens.radius.lg,
    background: [
      `linear-gradient(180deg, ${withAlpha(technicalEditorialTokens.color.canvasRaised, 0.28)}, ${withAlpha(technicalEditorialTokens.color.canvas, 0.18)})`,
      `linear-gradient(90deg, ${withAlpha(technicalEditorialTokens.color.textStrong, 0.02)} 1px, transparent 1px)`,
      `linear-gradient(0deg, ${withAlpha(technicalEditorialTokens.color.textStrong, 0.02)} 1px, transparent 1px)`,
    ].join(", "),
    backgroundSize: "auto, 88px 88px, 88px 88px",
    border: `1px solid ${technicalEditorialTokens.color.rule}`,
    overflow: "hidden",
  };

  return (
    <div style={panelStyle}>
      <SectionLabel>Diagram Build</SectionLabel>
      <div
        style={drawText({
          marginTop: 16,
          color: technicalEditorialTokens.color.textStrong,
          fontFamily: technicalEditorialTokens.typography.title.fontFamily,
          fontSize:
            fixture.density === "dense"
              ? 30
              : technicalEditorialTokens.typography.title.fontSize,
          lineHeight: technicalEditorialTokens.typography.title.lineHeight,
          fontWeight: technicalEditorialTokens.typography.title.fontWeight,
          maxWidth: 440,
        })}
      >
        {fixture.diagram.title}
      </div>
      <div
        style={drawText({
          marginTop: 10,
          color: technicalEditorialTokens.color.textMuted,
          fontFamily: technicalEditorialTokens.typography.caption.fontFamily,
          fontSize: technicalEditorialTokens.typography.caption.fontSize,
          lineHeight: technicalEditorialTokens.typography.caption.lineHeight,
          fontWeight: technicalEditorialTokens.typography.caption.fontWeight,
          maxWidth: 470,
        })}
      >
        {fixture.diagram.subtitle}
      </div>
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          top: 272,
          bottom: 28,
          display: "grid",
          gridTemplateRows: `repeat(${fixture.diagram.nodes.length}, minmax(0, 1fr))`,
          gap: 14,
        }}
      >
        {fixture.diagram.nodes.map((node, index) => {
          const tone = node.tone ?? "neutral";
          const palette = resolveTonePalette(technicalEditorialTokens, tone);

          return (
            <div
              key={node.label}
              style={{
                display: "grid",
                gridTemplateColumns:
                  index < fixture.diagram.connectors.length
                    ? "minmax(0, 1fr) 92px"
                    : "minmax(0, 1fr)",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...buildStaggeredEntrance(
                    index,
                    {
                      frame,
                      durationInFrames:
                        technicalEditorialTokens.motion.normalFrames,
                      preset: "fade-up",
                      distance: technicalEditorialTokens.motion.distanceMd,
                      policy: fixture.motionPolicy,
                    },
                    5,
                  ),
                  position: "relative",
                  minWidth: 0,
                  height: "100%",
                  padding: 12,
                  borderRadius: technicalEditorialTokens.radius.md,
                  border: `1px solid ${withAlpha(palette.border, 0.84)}`,
                  background: [
                    `linear-gradient(180deg, ${withAlpha(palette.background, 0.96)}, ${withAlpha(technicalEditorialTokens.color.surfaceElevated, 0.96)})`,
                    `linear-gradient(90deg, ${withAlpha(palette.accent, 0.18)} 0, transparent 70%)`,
                  ].join(", "),
                  boxShadow: technicalEditorialTokens.surface.shadowBase,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    color: palette.accent,
                    fontFamily:
                      technicalEditorialTokens.typography.label.fontFamily,
                    fontSize: 15,
                    lineHeight: 1.16,
                    fontWeight: 760,
                  }}
                >
                  {node.kicker}
                </div>
                <div
                  style={drawText({
                    marginTop: 10,
                    color: palette.text,
                    fontFamily:
                      technicalEditorialTokens.typography.title.fontFamily,
                    fontSize: 19,
                    lineHeight: 1.16,
                    fontWeight: 780,
                  })}
                >
                  {node.label}
                </div>
                <div
                  style={drawText({
                    marginTop: 8,
                    color: palette.mutedText,
                    fontFamily:
                      technicalEditorialTokens.typography.caption.fontFamily,
                    fontSize: 14,
                    lineHeight: 1.18,
                    fontWeight:
                      technicalEditorialTokens.typography.caption.fontWeight,
                  })}
                >
                  {node.detail}
                </div>
              </div>
              {index < fixture.diagram.connectors.length ? (
                <div
                  style={drawText({
                    color: technicalEditorialTokens.color.textSoft,
                    fontFamily:
                      technicalEditorialTokens.typography.caption.fontFamily,
                    fontSize: 13,
                    lineHeight: 1.18,
                    fontWeight: 620,
                    borderTop: `2px solid ${withAlpha(
                      technicalEditorialTokens.color.accent,
                      0.55,
                    )}`,
                    paddingTop: 8,
                  })}
                >
                  {fixture.diagram.connectors[index]}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CodePanel = ({
  fixture,
  frame,
}: {
  fixture: TechnicalEditorialFixture;
  frame: number;
}) => {
  return (
    <Surface
      tokens={technicalEditorialTokens}
      elevation="raised"
      style={{
        ...buildEntranceStyle({
          frame,
          durationInFrames: technicalEditorialTokens.motion.normalFrames,
          preset: "fade-left",
          distance: technicalEditorialTokens.motion.distanceMd,
          policy: fixture.motionPolicy,
        }),
        width: "100%",
        height: "100%",
        padding: 0,
        borderRadius: technicalEditorialTokens.radius.lg,
        background: `linear-gradient(180deg, ${withAlpha(technicalEditorialTokens.color.surfaceElevated, 0.96)}, ${withAlpha(technicalEditorialTokens.color.surface, 0.98)})`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          columnGap: 12,
          padding: "16px 20px",
          borderBottom: `1px solid ${technicalEditorialTokens.color.rule}`,
        }}
      >
        <div
          style={{
            color: technicalEditorialTokens.color.textStrong,
            fontFamily: technicalEditorialTokens.typography.label.fontFamily,
            fontSize: 16,
            lineHeight: 1.14,
            fontWeight: technicalEditorialTokens.typography.label.fontWeight,
            minWidth: 0,
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {fixture.code.filename}
        </div>
        <div
          style={{
            color: technicalEditorialTokens.color.textSoft,
            fontFamily: technicalEditorialTokens.typography.caption.fontFamily,
            fontSize: 15,
            lineHeight: 1.2,
            fontWeight: 620,
            justifySelf: "end",
          }}
        >
          {fixture.code.language}
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <SectionLabel tone="warning">Code / Data Callout</SectionLabel>
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gap: 10,
          }}
        >
          {fixture.code.lines.map((line, index) => (
            <div
              key={`${fixture.key}-${index}-${line}`}
              style={{
                ...buildStaggeredEntrance(
                  index,
                  {
                    frame,
                    durationInFrames:
                      technicalEditorialTokens.motion.fastFrames + 8,
                    preset: "fade-left",
                    distance: technicalEditorialTokens.motion.distanceSm,
                    policy: fixture.motionPolicy,
                  },
                  2,
                ),
                display: "grid",
                gridTemplateColumns: "32px minmax(0, 1fr)",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  color: technicalEditorialTokens.color.textSoft,
                  fontFamily:
                    technicalEditorialTokens.typography.mono.fontFamily,
                  fontSize: 15,
                  lineHeight: 1.4,
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={drawCodeText({
                  color:
                    index === fixture.code.lines.length - 1
                      ? technicalEditorialTokens.color.accent
                      : technicalEditorialTokens.color.textMuted,
                  fontFamily:
                    technicalEditorialTokens.typography.mono.fontFamily,
                  fontSize: 14,
                  lineHeight:
                    technicalEditorialTokens.typography.mono.lineHeight,
                  fontWeight:
                    technicalEditorialTokens.typography.mono.fontWeight,
                })}
              >
                {line}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
};

const StepsPanel = ({
  steps,
  frame,
  motionPolicy,
}: {
  steps: TechnicalEditorialStep[];
  frame: number;
  motionPolicy: TechnicalEditorialFixture["motionPolicy"];
}) => (
  <Surface
    tokens={technicalEditorialTokens}
    elevation="raised"
    style={{
      ...buildEntranceStyle({
        frame,
        durationInFrames: technicalEditorialTokens.motion.normalFrames,
        preset: "fade-up",
        distance: technicalEditorialTokens.motion.distanceSm,
        policy: motionPolicy,
      }),
      width: "100%",
      height: "100%",
      padding: technicalEditorialTokens.spacing.md,
      borderRadius: technicalEditorialTokens.radius.lg,
    }}
  >
    <SectionLabel tone="success">Summary Rail</SectionLabel>
    <div
      style={{
        marginTop: 16,
        display: "grid",
        gap: 14,
      }}
    >
      {steps.map((step, index) => (
        <div
          key={`${step.index}-${step.label}`}
          style={{
            ...buildStaggeredEntrance(
              index,
              {
                frame,
                durationInFrames:
                  technicalEditorialTokens.motion.fastFrames + 8,
                preset: "fade-up",
                distance: technicalEditorialTokens.motion.distanceSm,
                policy: motionPolicy,
              },
              3,
            ),
            display: "grid",
            gridTemplateColumns: "32px minmax(0, 1fr)",
            gap: 10,
            alignItems: "start",
            paddingTop: index === 0 ? 0 : 14,
            borderTop:
              index === 0
                ? "none"
                : `1px solid ${technicalEditorialTokens.color.rule}`,
          }}
        >
          <div
            style={{
              color: technicalEditorialTokens.color.accent,
              fontFamily: technicalEditorialTokens.typography.label.fontFamily,
              fontSize: 15,
              lineHeight: 1.16,
              fontWeight: 760,
            }}
          >
            {step.index}
          </div>
          <div>
            <div
              style={drawText({
                color: technicalEditorialTokens.color.textStrong,
                fontFamily:
                  technicalEditorialTokens.typography.title.fontFamily,
                fontSize: 19,
                lineHeight: 1.16,
                fontWeight: 760,
              })}
            >
              {step.label}
            </div>
            <div
              style={drawText({
                marginTop: 6,
                color: technicalEditorialTokens.color.textMuted,
                fontFamily:
                  technicalEditorialTokens.typography.caption.fontFamily,
                fontSize: technicalEditorialTokens.typography.caption.fontSize,
                lineHeight: 1.24,
                fontWeight:
                  technicalEditorialTokens.typography.caption.fontWeight,
              })}
            >
              {step.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  </Surface>
);

export const TechnicalEditorialScene = ({
  sceneKey,
}: {
  sceneKey: TechnicalEditorialFixtureKey;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fixture = technicalEditorialFixtures[sceneKey];
  const layout = resolveVerticalLayout({
    platform: "tiktok",
    reservedHeader: 0,
    reservedFooter: 0,
    contentInset: { left: 0, right: 0, top: 0, bottom: 0 },
    maxContentWidth: technicalEditorialTokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(
    layout.content,
    technicalEditorialTokens.grid.columns,
    technicalEditorialTokens.grid.gutter,
  );
  const headerBox = makeBox(
    layout.content.x,
    layout.content.y,
    layout.content.width,
    headerHeight,
  );
  const summaryBox = makeBox(
    layout.content.x,
    layout.content.y + headerHeight + rowGap,
    layout.content.width,
    summaryHeight,
  );
  const mainTop = summaryBox.y + summaryBox.height + rowGap;
  const mainHeight = layout.content.y + layout.content.height - mainTop;
  const leftBox = makeBox(
    spanColumns(columns, 0, 3).x,
    mainTop,
    spanColumns(columns, 0, 3).width,
    mainHeight,
  );
  const centerBox = makeBox(
    spanColumns(columns, 3, 5).x,
    mainTop,
    spanColumns(columns, 3, 5).width,
    mainHeight,
  );
  const rightBox = makeBox(
    spanColumns(columns, 8, 4).x,
    mainTop,
    spanColumns(columns, 8, 4).width,
    mainHeight,
  );
  const titleFit = fitTypographyToBox({
    tokens: technicalEditorialTokens,
    role: "headline",
    text: fixture.title,
    width: headerBox.width - 236,
    height: 156,
    maxLines: fixture.density === "dense" ? 4 : 3,
    density: fixture.density,
    minScale: 0.68,
  });
  const summaryFit = fitTypographyToBox({
    tokens: technicalEditorialTokens,
    role: "body",
    text: fixture.summary,
    width: summaryBox.width - 280,
    height: 88,
    maxLines: 3,
    density: fixture.density,
    minScale: 0.84,
  });
  const progress = spring({
    fps,
    frame,
    durationInFrames: 42,
    config: {
      damping: 200,
      stiffness: 120,
      mass: 0.8,
    },
  });
  const compactAnnotationRail = fixture.annotations.length > 3;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${technicalEditorialTokens.color.canvas} 0%, ${technicalEditorialTokens.color.canvasRaised} 100%)`,
        color: technicalEditorialTokens.color.textStrong,
        fontFamily: technicalEditorialTokens.typography.body.fontFamily,
      }}
    >
      <RuleMatrix />
      <div
        style={{
          position: "absolute",
          left: layout.safe.x,
          top: layout.safe.y - 22,
          width: layout.safe.width,
          height: 2,
          background: withAlpha(technicalEditorialTokens.color.accent, 0.5),
          transform: `scaleX(${0.18 + progress * 0.82})`,
          transformOrigin: "left center",
        }}
      />
      <BoxFrame box={headerBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: technicalEditorialTokens.motion.normalFrames,
              preset: "fade-up",
              distance: technicalEditorialTokens.motion.distanceMd,
              policy: fixture.motionPolicy,
            }),
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 188px",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                color: technicalEditorialTokens.color.accent,
                fontFamily:
                  technicalEditorialTokens.typography.label.fontFamily,
                fontSize: technicalEditorialTokens.typography.label.fontSize,
                lineHeight:
                  technicalEditorialTokens.typography.label.lineHeight,
                fontWeight:
                  technicalEditorialTokens.typography.label.fontWeight,
              }}
            >
              {fixture.eyebrow}
            </div>
            <div
              style={drawText({
                marginTop: 18,
                color: technicalEditorialTokens.color.textStrong,
                fontFamily: titleFit.style.fontFamily,
                fontSize: titleFit.style.fontSize,
                lineHeight: titleFit.style.lineHeight,
                fontWeight: titleFit.style.fontWeight,
                maxWidth: headerBox.width - 220,
              })}
            >
              {fixture.title}
            </div>
          </div>
          <Surface
            tokens={technicalEditorialTokens}
            tone="inverse"
            style={{
              alignSelf: "start",
              padding: 18,
              borderRadius: technicalEditorialTokens.radius.md,
            }}
          >
            <div
              style={{
                color: technicalEditorialTokens.color.canvasRaised,
                fontFamily:
                  technicalEditorialTokens.typography.label.fontFamily,
                fontSize: 15,
                lineHeight: 1.16,
                fontWeight: 760,
              }}
            >
              Scene
            </div>
            <div
              style={{
                marginTop: 8,
                color: technicalEditorialTokens.color.canvas,
                fontFamily:
                  technicalEditorialTokens.typography.title.fontFamily,
                fontSize: 26,
                lineHeight: 1.12,
                fontWeight: 780,
              }}
            >
              {fixture.sceneLabel}
            </div>
          </Surface>
        </div>
      </BoxFrame>
      <BoxFrame box={summaryBox}>
        <Surface
          tokens={technicalEditorialTokens}
          elevation="raised"
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: technicalEditorialTokens.motion.normalFrames,
              preset: "fade-up",
              distance: technicalEditorialTokens.motion.distanceSm,
              delayFrames: 4,
              policy: fixture.motionPolicy,
            }),
            width: "100%",
            height: "100%",
            padding: technicalEditorialTokens.spacing.lg,
            borderRadius: technicalEditorialTokens.radius.lg,
            display: "grid",
            gridTemplateColumns: "224px minmax(0, 1fr)",
            gap: 22,
          }}
        >
          <div
            style={{
              paddingRight: 22,
              borderRight: `1px solid ${technicalEditorialTokens.color.rule}`,
            }}
          >
            <SectionLabel>Why this layout</SectionLabel>
            <div
              style={drawText({
                marginTop: 14,
                color: technicalEditorialTokens.color.textMuted,
                fontFamily:
                  technicalEditorialTokens.typography.caption.fontFamily,
                fontSize: technicalEditorialTokens.typography.caption.fontSize,
                lineHeight: 1.3,
                fontWeight:
                  technicalEditorialTokens.typography.caption.fontWeight,
              })}
            >
              Grid, rules, annotations, and evidence surfaces stay explicit even
              when copy density rises.
            </div>
          </div>
          <div
            style={drawText({
              color: technicalEditorialTokens.color.textStrong,
              fontFamily: summaryFit.style.fontFamily,
              fontSize: summaryFit.style.fontSize,
              lineHeight: summaryFit.style.lineHeight,
              fontWeight: summaryFit.style.fontWeight,
              alignSelf: "center",
            })}
          >
            {fixture.summary}
          </div>
        </Surface>
      </BoxFrame>
      <BoxFrame box={leftBox}>
        <div
          style={{
            display: "grid",
            gridTemplateRows: "auto auto",
            gap: technicalEditorialTokens.spacing.lg,
            height: "100%",
          }}
        >
          <Surface
            tokens={technicalEditorialTokens}
            elevation="raised"
            style={{
              padding: compactAnnotationRail ? 14 : 16,
              borderRadius: technicalEditorialTokens.radius.lg,
            }}
          >
            <SectionLabel>Annotation Rail</SectionLabel>
            <div
              style={{
                marginTop: compactAnnotationRail ? 14 : 18,
                display: "grid",
                gap: compactAnnotationRail ? 8 : 12,
              }}
            >
              {fixture.annotations.map((annotation, index) => (
                <AnnotationCard
                  key={`${annotation.label}-${annotation.value}`}
                  annotation={annotation}
                  index={index}
                  frame={frame}
                  motionPolicy={fixture.motionPolicy}
                  compact={compactAnnotationRail}
                />
              ))}
            </div>
          </Surface>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            {fixture.metrics.map((metric, index) => (
              <MetricCard
                key={`${metric.label}-${metric.value}`}
                metric={metric}
                index={index}
                frame={frame}
                motionPolicy={fixture.motionPolicy}
              />
            ))}
          </div>
        </div>
      </BoxFrame>
      <BoxFrame box={centerBox}>
        <DiagramPanel fixture={fixture} frame={frame} />
      </BoxFrame>
      <BoxFrame box={rightBox}>
        <div
          style={{
            display: "grid",
            gridTemplateRows: "minmax(0, 0.48fr) minmax(0, 0.52fr)",
            gap: technicalEditorialTokens.spacing.lg,
            height: "100%",
          }}
        >
          <CodePanel fixture={fixture} frame={frame} />
          <StepsPanel
            steps={fixture.steps}
            frame={frame}
            motionPolicy={fixture.motionPolicy}
          />
        </div>
      </BoxFrame>
      <div
        style={{
          position: "absolute",
          left: layout.safe.x,
          right: layout.safe.x,
          bottom: layout.safe.y + 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: technicalEditorialTokens.color.textSoft,
          fontFamily: technicalEditorialTokens.typography.caption.fontFamily,
          fontSize: 15,
          lineHeight: 1.2,
          fontWeight: 620,
        }}
      >
        <span>{fixture.footer.left}</span>
        <span>{fixture.footer.right}</span>
      </div>
    </AbsoluteFill>
  );
};
