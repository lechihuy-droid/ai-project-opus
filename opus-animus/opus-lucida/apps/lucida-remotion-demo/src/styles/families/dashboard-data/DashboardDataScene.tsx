import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  BoxFrame,
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
  dashboardDataFixtures,
  type DashboardDataFixtureKey,
} from "../../../../pipeline/fixtures/styles/dashboard-data";
import { dashboardDataTokens } from "./tokens";
import type {
  DashboardDataChartPanel,
  DashboardDataFixture,
  DashboardDataMetric,
  DashboardDataOperationRow,
  DashboardDataPanelState,
  DashboardDataStateMessage,
  DashboardDataWatchItem,
} from "./types";

const headerHeight = 238;
const panelGap = 16;

const layoutProfiles: Record<
  DashboardDataFixtureKey,
  {
    kpiHeight: number;
    midHeight: number;
  }
> = {
  normal: {
    kpiHeight: 350,
    midHeight: 456,
  },
  dense: {
    kpiHeight: 350,
    midHeight: 420,
  },
  edge: {
    kpiHeight: 326,
    midHeight: 538,
  },
  "operations-monitor": {
    kpiHeight: 350,
    midHeight: 456,
  },
  "comparison-dashboard": {
    kpiHeight: 350,
    midHeight: 456,
  },
  "benchmark-grid": {
    kpiHeight: 350,
    midHeight: 420,
  },
  "trend-panel": {
    kpiHeight: 350,
    midHeight: 456,
  },
  scorecard: {
    kpiHeight: 350,
    midHeight: 420,
  },
};

const drawText = (style: CSSProperties): CSSProperties => ({
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  ...style,
});

const panelStyle = (
  tone: "neutral" | "accent" = "neutral",
  padding = 20,
): CSSProperties => {
  const accent =
    tone === "accent"
      ? withAlpha(dashboardDataTokens.color.accent, 0.1)
      : withAlpha(dashboardDataTokens.color.surfaceElevated, 0.92);

  return {
    position: "relative",
    width: "100%",
    height: "100%",
    padding,
    borderRadius: dashboardDataTokens.radius.lg,
    border: `1px solid ${dashboardDataTokens.color.rule}`,
    background: [
      `linear-gradient(180deg, ${withAlpha(dashboardDataTokens.color.canvasRaised, 0.96)}, ${accent})`,
      `linear-gradient(90deg, ${withAlpha(dashboardDataTokens.color.textStrong, 0.02)} 1px, transparent 1px)`,
    ].join(", "),
    backgroundSize: "auto, 96px 96px",
    boxShadow: `${dashboardDataTokens.surface.shadowBase}, ${dashboardDataTokens.surface.highlight}`,
    overflow: "hidden",
  };
};

const SectionEyebrow = ({
  children,
  tone = "accent",
}: {
  children: string;
  tone?: "accent" | "success" | "warning" | "danger";
}) => {
  const color =
    tone === "success"
      ? dashboardDataTokens.color.success
      : tone === "warning"
        ? dashboardDataTokens.color.warning
        : tone === "danger"
          ? dashboardDataTokens.color.danger
          : dashboardDataTokens.color.accent;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color,
        fontFamily: dashboardDataTokens.typography.label.fontFamily,
        fontSize: dashboardDataTokens.typography.label.fontSize,
        lineHeight: dashboardDataTokens.typography.label.lineHeight,
        fontWeight: dashboardDataTokens.typography.label.fontWeight,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 0 4px ${withAlpha(color, 0.16)}`,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
};

const StatusChip = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "inverse";
}) => {
  const palette = resolveTonePalette(dashboardDataTokens, tone);

  return (
    <div
      style={{
        minHeight: 70,
        padding: "10px 12px",
        borderRadius: dashboardDataTokens.radius.md,
        border: `1px solid ${withAlpha(palette.border, 0.9)}`,
        background: withAlpha(palette.background, 0.96),
      }}
    >
      <div
        style={{
          color: palette.mutedText,
          fontFamily: dashboardDataTokens.typography.label.fontFamily,
          fontSize: 11,
          lineHeight: 1.12,
          fontWeight: 760,
        }}
      >
        {label}
      </div>
      <div
        style={drawText({
          marginTop: 5,
          color: palette.text,
          fontFamily: dashboardDataTokens.typography.title.fontFamily,
          fontSize: 17,
          lineHeight: 1.12,
          fontWeight: 760,
        })}
      >
        {value}
      </div>
    </div>
  );
};

const Sparkline = ({
  values,
  tone = "accent",
}: {
  values: number[];
  tone?: DashboardDataMetric["tone"];
}) => {
  const maxValue = Math.max(...values, 1);
  const color =
    tone === "success"
      ? dashboardDataTokens.color.success
      : tone === "warning"
        ? dashboardDataTokens.color.warning
        : tone === "danger"
          ? dashboardDataTokens.color.danger
          : dashboardDataTokens.color.accent;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
        gap: 4,
        alignItems: "end",
        height: 22,
      }}
    >
      {values.map((value, index) => (
        <div
          key={`${index}-${value}`}
          style={{
            height: `${Math.max(4, (value / maxValue) * 22)}px`,
            borderRadius: 999,
            background: `linear-gradient(180deg, ${withAlpha(color, 0.92)}, ${withAlpha(color, 0.24)})`,
          }}
        />
      ))}
    </div>
  );
};

const PanelStateView = ({
  state,
  message,
  frame,
  policy,
  mode = "stacked",
}: {
  state: DashboardDataPanelState;
  message: DashboardDataStateMessage;
  frame: number;
  policy: DashboardDataFixture["motionPolicy"];
  mode?: "stacked" | "kpi" | "compact";
}) => {
  const tone =
    state === "error"
      ? "danger"
      : state === "empty"
        ? "warning"
        : state === "loading"
          ? "accent"
          : message.tone ?? "neutral";
  const palette = resolveTonePalette(dashboardDataTokens, tone);
  const placeholderLabels = message.placeholderLabels ?? [];

  return (
    <div
      style={{
        ...buildEntranceStyle({
          frame,
          durationInFrames: dashboardDataTokens.motion.normalFrames,
          preset: "fade-up",
          distance: dashboardDataTokens.motion.distanceSm,
          policy,
        }),
        display: "grid",
        gap: mode === "stacked" ? 14 : 10,
        height: "100%",
        alignContent: "start",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          color: palette.accent,
          fontFamily: dashboardDataTokens.typography.label.fontFamily,
          fontSize: dashboardDataTokens.typography.label.fontSize,
          lineHeight: dashboardDataTokens.typography.label.lineHeight,
          fontWeight: dashboardDataTokens.typography.label.fontWeight,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: palette.accent,
          }}
        />
        {message.title}
      </div>
      <div
        style={drawText({
          color: palette.text,
          fontFamily: dashboardDataTokens.typography.title.fontFamily,
          fontSize: mode === "stacked" ? 24 : 22,
          lineHeight: 1.16,
          fontWeight: 760,
          maxWidth: mode === "kpi" ? "100%" : 520,
        })}
      >
        {message.detail}
      </div>
      {placeholderLabels.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              mode === "kpi" ? "repeat(4, minmax(0, 1fr))" : undefined,
            gap: mode === "kpi" ? 8 : 10,
            marginTop: mode === "kpi" ? 4 : 6,
          }}
        >
          {placeholderLabels.map((label, index) => (
            <div
              key={`${label}-${index}`}
              style={{
                ...buildStaggeredEntrance(
                  index,
                  {
                    frame,
                    durationInFrames: dashboardDataTokens.motion.fastFrames + 6,
                    preset: "fade-up",
                    distance: dashboardDataTokens.motion.distanceSm,
                    policy,
                  },
                  2,
                ),
                display: "grid",
                gap: mode === "kpi" ? 7 : 8,
                padding: mode === "kpi" ? "10px 12px" : "12px 14px",
                borderRadius: dashboardDataTokens.radius.md,
                border: `1px solid ${withAlpha(palette.border, 0.7)}`,
                background: withAlpha(palette.background, 0.76),
              }}
            >
              <div
                style={{
                  color: palette.mutedText,
                  fontFamily: dashboardDataTokens.typography.caption.fontFamily,
                  fontSize:
                    mode === "kpi"
                      ? 13
                      : dashboardDataTokens.typography.caption.fontSize,
                  lineHeight:
                    mode === "kpi"
                      ? 1.14
                      : dashboardDataTokens.typography.caption.lineHeight,
                  fontWeight: dashboardDataTokens.typography.caption.fontWeight,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: mode === "kpi" ? 8 : 10,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${withAlpha(palette.accent, 0.3)} 0%, ${withAlpha(palette.accent, 0.08)} 100%)`,
                }}
              />
            </div>
          ))}
        </div>
      ) : null}
      {message.lines && message.lines.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: mode === "stacked" ? 10 : 8,
            marginTop: mode === "stacked" ? 4 : 2,
          }}
        >
          {message.lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                ...buildStaggeredEntrance(
                  index,
                  {
                    frame,
                    durationInFrames: dashboardDataTokens.motion.fastFrames + 6,
                    preset: "fade-up",
                    distance: dashboardDataTokens.motion.distanceSm,
                    policy,
                  },
                  2,
                ),
                color: palette.mutedText,
                fontFamily: dashboardDataTokens.typography.caption.fontFamily,
                fontSize:
                  mode === "stacked"
                    ? dashboardDataTokens.typography.caption.fontSize
                    : 14,
                lineHeight: mode === "stacked" ? 1.32 : 1.24,
                fontWeight: dashboardDataTokens.typography.caption.fontWeight,
                paddingLeft: mode === "stacked" ? 14 : 12,
                borderLeft: `2px solid ${withAlpha(palette.accent, 0.52)}`,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const KpiMetric = ({
  metric,
  index,
  frame,
  policy,
}: {
  metric: DashboardDataMetric;
  index: number;
  frame: number;
  policy: DashboardDataFixture["motionPolicy"];
}) => {
  const palette = resolveTonePalette(
    dashboardDataTokens,
    metric.tone ?? "neutral",
  );

  return (
    <div
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: dashboardDataTokens.motion.fastFrames + 8,
            preset: "fade-up",
            distance: dashboardDataTokens.motion.distanceSm,
            policy,
          },
          2,
        ),
        display: "grid",
        gridTemplateColumns: "64px minmax(0, 1fr) 62px",
        gap: 8,
        alignItems: "start",
        minHeight: 82,
        padding: "8px 12px",
        borderTop:
          index > 1 ? `1px solid ${dashboardDataTokens.color.rule}` : "none",
        borderLeft:
          index % 2 === 0
            ? "none"
            : `1px solid ${dashboardDataTokens.color.rule}`,
      }}
    >
      <div
        style={{
          color: palette.text,
          fontFamily: dashboardDataTokens.typography.headline.fontFamily,
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 820,
        }}
      >
        {metric.value}
      </div>
      <div>
        <div
          style={{
            color: palette.mutedText,
            fontFamily: dashboardDataTokens.typography.label.fontFamily,
            fontSize: 12,
            lineHeight: 1.08,
            fontWeight: 760,
          }}
        >
          {metric.label}
        </div>
        <div
          style={drawText({
            marginTop: 4,
            color: palette.accent,
            fontFamily: dashboardDataTokens.typography.caption.fontFamily,
            fontSize: 12,
            lineHeight: 1.12,
            fontWeight: 700,
          })}
        >
          {metric.change}
        </div>
        <div
          style={drawText({
            marginTop: 4,
            color: palette.mutedText,
            fontFamily: dashboardDataTokens.typography.caption.fontFamily,
            fontSize: 12,
            lineHeight: 1.12,
            fontWeight: dashboardDataTokens.typography.caption.fontWeight,
          })}
        >
          {metric.detail}
        </div>
      </div>
      {metric.sparkline && metric.sparkline.length > 1 ? (
        <Sparkline values={metric.sparkline} tone={metric.tone} />
      ) : null}
    </div>
  );
};

const KpiPanel = ({
  fixture,
  box,
  frame,
}: {
  fixture: DashboardDataFixture;
  box: ReturnType<typeof makeBox>;
  frame: number;
}) => (
  <BoxFrame
    box={box}
    style={buildEntranceStyle({
      frame,
      durationInFrames: dashboardDataTokens.motion.normalFrames,
      preset: "fade-up",
      distance: dashboardDataTokens.motion.distanceSm,
      delayFrames: 3,
      policy: fixture.motionPolicy,
    })}
  >
    <div
      style={{
        ...panelStyle("accent"),
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <div>
          <SectionEyebrow>Topline KPIs</SectionEyebrow>
          <div
            style={drawText({
              marginTop: 10,
              color: dashboardDataTokens.color.textStrong,
              fontFamily: dashboardDataTokens.typography.title.fontFamily,
              fontSize: 26,
              lineHeight: 1.12,
              fontWeight: dashboardDataTokens.typography.title.fontWeight,
            })}
          >
            {fixture.kpis.title}
          </div>
          <div
            style={drawText({
              marginTop: 6,
              color: dashboardDataTokens.color.textMuted,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: 14,
              lineHeight: 1.22,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
              maxWidth: 680,
            })}
          >
            {fixture.kpis.subtitle}
          </div>
        </div>
        <div
          style={{
            color: dashboardDataTokens.color.textSoft,
            fontFamily: dashboardDataTokens.typography.caption.fontFamily,
            fontSize: 13,
            lineHeight: 1.18,
            fontWeight: dashboardDataTokens.typography.caption.fontWeight,
            textAlign: "right",
            maxWidth: 210,
          }}
        >
          {fixture.timestampLabel}
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${dashboardDataTokens.color.rule}`,
          minHeight: 0,
        }}
      >
        {fixture.kpis.state === "ready" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 0,
            }}
          >
            {fixture.kpis.metrics.map((metric, index) => (
              <KpiMetric
                key={`${metric.label}-${metric.value}`}
                metric={metric}
                index={index}
                frame={frame}
                policy={fixture.motionPolicy}
              />
            ))}
          </div>
        ) : fixture.kpis.stateMessage ? (
          <PanelStateView
            state={fixture.kpis.state}
            message={fixture.kpis.stateMessage}
            frame={frame}
            policy={fixture.motionPolicy}
            mode="kpi"
          />
        ) : null}
      </div>
    </div>
  </BoxFrame>
);

const ChartBars = ({
  chart,
  frame,
  policy,
}: {
  chart: DashboardDataChartPanel;
  frame: number;
  policy: DashboardDataFixture["motionPolicy"];
}) => {
  const primaryColor = resolveTonePalette(
    dashboardDataTokens,
    chart.series.primaryTone ?? "accent",
  ).accent;
  const secondaryColor = resolveTonePalette(
    dashboardDataTokens,
    chart.series.secondaryTone ?? "success",
  ).accent;
  const maxValue = Math.max(
    ...chart.points.flatMap((point) => [point.primary, point.secondary ?? 0]),
    1,
  );
  const plotHeight = chart.points.length > 8 ? 140 : 154;
  const labelHeight = 22;
  const chartHeight = plotHeight + labelHeight;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "54px minmax(0, 1fr)",
        gap: 16,
        height: chartHeight,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          alignContent: "space-between",
          color: dashboardDataTokens.color.textSoft,
          fontFamily: dashboardDataTokens.typography.caption.fontFamily,
          fontSize: 13,
          lineHeight: 1.1,
          fontWeight: 700,
          height: plotHeight,
          paddingTop: 2,
          paddingBottom: 4,
        }}
      >
        {chart.yAxisLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div
        style={{
          position: "relative",
          borderLeft: `1px solid ${dashboardDataTokens.color.rule}`,
          borderBottom: `1px solid ${dashboardDataTokens.color.rule}`,
          padding: "0 10px 0 18px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: `0 0 ${labelHeight}px 18px`,
            display: "grid",
            gridTemplateRows: "repeat(4, minmax(0, 1fr))",
            pointerEvents: "none",
          }}
        >
          {chart.yAxisLabels.slice(1).map((label) => (
            <div
              key={`${label}-rule`}
              style={{
                borderTop: `1px dashed ${withAlpha(
                  dashboardDataTokens.color.rule,
                  0.9,
                )}`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: "0 0 0 18px",
            display: "grid",
            gridTemplateColumns: `repeat(${chart.points.length}, minmax(0, 1fr))`,
            gap: chart.points.length > 8 ? 7 : 10,
            alignItems: "end",
          }}
        >
          {chart.points.map((point, index) => {
            const primaryHeight = Math.max(
              8,
              (point.primary / maxValue) * plotHeight,
            );
            const secondaryValue = point.secondary ?? 0;
            const secondaryHeight =
              secondaryValue > 0
                ? Math.max(8, (secondaryValue / maxValue) * plotHeight)
                : 0;

            return (
              <div
                key={`${point.label}-${index}`}
                style={{
                  ...buildStaggeredEntrance(
                    index,
                    {
                      frame,
                      durationInFrames:
                        dashboardDataTokens.motion.normalFrames + 4,
                      preset: "fade-up",
                      distance: dashboardDataTokens.motion.distanceSm,
                      policy,
                    },
                    1,
                  ),
                  display: "grid",
                  gridTemplateRows: `${plotHeight}px ${labelHeight}px`,
                  gap: 0,
                  alignSelf: "stretch",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      secondaryValue > 0 ? "1fr 1fr" : "1fr",
                    gap: 6,
                    alignItems: "end",
                    height: plotHeight,
                  }}
                >
                  <div
                    style={{
                      height: primaryHeight,
                      borderRadius: "8px 8px 0 0",
                      background: `linear-gradient(180deg, ${withAlpha(primaryColor, 0.95)}, ${withAlpha(primaryColor, 0.26)})`,
                    }}
                  />
                  {secondaryValue > 0 ? (
                    <div
                      style={{
                        height: secondaryHeight,
                        borderRadius: "8px 8px 0 0",
                        background: `linear-gradient(180deg, ${withAlpha(secondaryColor, 0.92)}, ${withAlpha(secondaryColor, 0.22)})`,
                      }}
                    />
                  ) : null}
                </div>
                <div
                  style={{
                    color: dashboardDataTokens.color.textSoft,
                    fontFamily: dashboardDataTokens.typography.caption.fontFamily,
                    fontSize: 13,
                    lineHeight: `${labelHeight}px`,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {point.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ChartPanel = ({
  fixture,
  box,
  frame,
}: {
  fixture: DashboardDataFixture;
  box: ReturnType<typeof makeBox>;
  frame: number;
}) => (
  <BoxFrame
    box={box}
    style={buildEntranceStyle({
      frame,
      durationInFrames: dashboardDataTokens.motion.normalFrames,
      preset: "fade-up",
      distance: dashboardDataTokens.motion.distanceMd,
      delayFrames: 5,
      policy: fixture.motionPolicy,
    })}
  >
    <div style={panelStyle()}>
      <div
        style={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <div>
          <SectionEyebrow tone="success">Trend View</SectionEyebrow>
          <div
            style={drawText({
              marginTop: 10,
              color: dashboardDataTokens.color.textStrong,
              fontFamily: dashboardDataTokens.typography.title.fontFamily,
              fontSize: 26,
              lineHeight: 1.12,
              fontWeight: dashboardDataTokens.typography.title.fontWeight,
            })}
          >
            {fixture.chart.title}
          </div>
          <div
            style={drawText({
              marginTop: 6,
              color: dashboardDataTokens.color.textMuted,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: 14,
              lineHeight: 1.24,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
              maxWidth: 470,
            })}
          >
            {fixture.chart.subtitle}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 8,
            justifyItems: "start",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: dashboardDataTokens.color.textMuted,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: dashboardDataTokens.typography.caption.fontSize,
              lineHeight: 1.2,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: dashboardDataTokens.color.accent,
              }}
            />
            {fixture.chart.series.primaryLabel}
          </div>
          {fixture.chart.series.secondaryLabel ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: dashboardDataTokens.color.textMuted,
                fontFamily: dashboardDataTokens.typography.caption.fontFamily,
                fontSize: dashboardDataTokens.typography.caption.fontSize,
                lineHeight: 1.2,
                fontWeight: dashboardDataTokens.typography.caption.fontWeight,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: dashboardDataTokens.color.success,
                }}
              />
              {fixture.chart.series.secondaryLabel}
            </div>
          ) : null}
        </div>
      </div>
      {fixture.chart.state === "ready" ? (
        <>
          <ChartBars
            chart={fixture.chart}
            frame={frame}
            policy={fixture.motionPolicy}
          />
          <div
            style={drawText({
              marginTop: 16,
              color: dashboardDataTokens.color.textSoft,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: 13,
              lineHeight: 1.24,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
            })}
          >
            {fixture.chart.footer}
          </div>
        </>
      ) : fixture.chart.stateMessage ? (
        <div style={{ marginTop: 16 }}>
          <PanelStateView
            state={fixture.chart.state}
            message={fixture.chart.stateMessage}
            frame={frame}
            policy={fixture.motionPolicy}
            mode="compact"
          />
        </div>
      ) : null}
    </div>
  </BoxFrame>
);

const WatchlistPanel = ({
  items,
  title,
  subtitle,
  box,
  frame,
  policy,
}: {
  items: DashboardDataWatchItem[];
  title: string;
  subtitle: string;
  box: ReturnType<typeof makeBox>;
  frame: number;
  policy: DashboardDataFixture["motionPolicy"];
}) => (
  <BoxFrame
    box={box}
    style={buildEntranceStyle({
      frame,
      durationInFrames: dashboardDataTokens.motion.normalFrames,
      preset: "fade-left",
      distance: dashboardDataTokens.motion.distanceMd,
      delayFrames: 6,
      policy,
    })}
  >
    <div style={panelStyle()}>
      <SectionEyebrow tone="warning">Watchlist</SectionEyebrow>
      <div
        style={drawText({
          marginTop: 10,
          color: dashboardDataTokens.color.textStrong,
          fontFamily: dashboardDataTokens.typography.title.fontFamily,
          fontSize: 24,
          lineHeight: 1.1,
          fontWeight: dashboardDataTokens.typography.title.fontWeight,
        })}
      >
        {title}
      </div>
      <div
        style={drawText({
          marginTop: 6,
          color: dashboardDataTokens.color.textMuted,
          fontFamily: dashboardDataTokens.typography.caption.fontFamily,
          fontSize: 13,
          lineHeight: 1.18,
          fontWeight: dashboardDataTokens.typography.caption.fontWeight,
        })}
      >
        {subtitle}
      </div>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 6,
        }}
      >
        {items.map((item, index) => {
          const palette = resolveTonePalette(
            dashboardDataTokens,
            item.tone ?? "neutral",
          );

          return (
            <div
              key={`${item.label}-${item.value}`}
              style={{
                ...buildStaggeredEntrance(
                  index,
                  {
                    frame,
                    durationInFrames: dashboardDataTokens.motion.fastFrames + 8,
                    preset: "fade-left",
                    distance: dashboardDataTokens.motion.distanceSm,
                    policy,
                  },
                  2,
                ),
                paddingBottom: 6,
                borderBottom:
                  index === items.length - 1
                    ? "none"
                    : `1px solid ${dashboardDataTokens.color.rule}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    color: palette.mutedText,
                    fontFamily: dashboardDataTokens.typography.label.fontFamily,
                    fontSize: 12,
                    lineHeight: 1.08,
                    fontWeight: 760,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: palette.accent,
                    fontFamily: dashboardDataTokens.typography.title.fontFamily,
                    fontSize: 16,
                    lineHeight: 1.1,
                    fontWeight: 760,
                    textAlign: "right",
                  }}
                >
                  {item.value}
                </div>
              </div>
              <div
                style={drawText({
                  marginTop: 4,
                  color: palette.mutedText,
                  fontFamily: dashboardDataTokens.typography.caption.fontFamily,
                  fontSize: 12,
                  lineHeight: 1.16,
                  fontWeight: dashboardDataTokens.typography.caption.fontWeight,
                })}
              >
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </BoxFrame>
);

const OperationRow = ({
  row,
  index,
  frame,
  policy,
}: {
  row: DashboardDataOperationRow;
  index: number;
  frame: number;
  policy: DashboardDataFixture["motionPolicy"];
}) => {
  const palette = resolveTonePalette(dashboardDataTokens, row.tone ?? "neutral");

  return (
    <div
      style={{
        ...buildStaggeredEntrance(
          index,
          {
            frame,
            durationInFrames: dashboardDataTokens.motion.fastFrames + 8,
            preset: "fade-up",
            distance: dashboardDataTokens.motion.distanceSm,
            policy,
          },
          2,
        ),
        display: "grid",
        gridTemplateColumns: "2.2fr 1.1fr 0.9fr 0.9fr",
        gap: 14,
        padding: "8px 0",
        borderBottom:
          index === 0 ? `1px solid ${dashboardDataTokens.color.rule}` : "none",
      }}
    >
      <div>
        <div
          style={{
            color: dashboardDataTokens.color.textStrong,
            fontFamily: dashboardDataTokens.typography.body.fontFamily,
            fontSize: 18,
            lineHeight: 1.16,
            fontWeight: 640,
          }}
        >
          {row.queue}
        </div>
        <div
          style={drawText({
            marginTop: 4,
            color: dashboardDataTokens.color.textMuted,
            fontFamily: dashboardDataTokens.typography.caption.fontFamily,
            fontSize: 13,
            lineHeight: 1.2,
            fontWeight: dashboardDataTokens.typography.caption.fontWeight,
          })}
        >
          {row.detail}
        </div>
      </div>
      <div
        style={{
          color: dashboardDataTokens.color.textStrong,
          fontFamily: dashboardDataTokens.typography.caption.fontFamily,
          fontSize: 13,
          lineHeight: 1.2,
          fontWeight: 700,
          paddingTop: 4,
        }}
      >
        {row.owner}
      </div>
      <div
        style={{
          color: dashboardDataTokens.color.textStrong,
          fontFamily: dashboardDataTokens.typography.caption.fontFamily,
          fontSize: 13,
          lineHeight: 1.2,
          fontWeight: 700,
          paddingTop: 4,
        }}
      >
        {row.window}
      </div>
      <div
        style={{
          color: dashboardDataTokens.color.textStrong,
          fontFamily: dashboardDataTokens.typography.caption.fontFamily,
          fontSize: 13,
          lineHeight: 1.2,
          fontWeight: 700,
          paddingTop: 4,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: palette.accent,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: palette.accent,
            }}
          />
          {row.status}
        </div>
      </div>
    </div>
  );
};

const OperationsPanel = ({
  fixture,
  box,
  frame,
}: {
  fixture: DashboardDataFixture;
  box: ReturnType<typeof makeBox>;
  frame: number;
}) => (
  <BoxFrame
    box={box}
    style={buildEntranceStyle({
      frame,
      durationInFrames: dashboardDataTokens.motion.normalFrames,
      preset: "fade-up",
      distance: dashboardDataTokens.motion.distanceMd,
      delayFrames: 7,
      policy: fixture.motionPolicy,
    })}
  >
    <div style={panelStyle()}>
      <div
        style={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <SectionEyebrow tone="danger">Operations</SectionEyebrow>
          <div
            style={drawText({
              marginTop: 10,
              color: dashboardDataTokens.color.textStrong,
              fontFamily: dashboardDataTokens.typography.title.fontFamily,
              fontSize: 26,
              lineHeight: 1.12,
              fontWeight: dashboardDataTokens.typography.title.fontWeight,
            })}
          >
            {fixture.operations.title}
          </div>
          <div
            style={drawText({
              marginTop: 6,
              color: dashboardDataTokens.color.textMuted,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: 14,
              lineHeight: 1.22,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
              maxWidth: 720,
            })}
          >
            {fixture.operations.subtitle}
          </div>
        </div>
        <div
          style={{
            color: dashboardDataTokens.color.textSoft,
            fontFamily: dashboardDataTokens.typography.label.fontFamily,
            fontSize: 13,
            lineHeight: 1.12,
            fontWeight: 760,
            textAlign: "right",
            maxWidth: 220,
          }}
        >
          {fixture.footer}
        </div>
      </div>
      {fixture.operations.state === "ready" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 1.1fr 0.9fr 0.9fr",
              gap: 14,
              marginTop: 14,
              paddingBottom: 10,
              borderBottom: `1px solid ${dashboardDataTokens.color.rule}`,
              color: dashboardDataTokens.color.textSoft,
              fontFamily: dashboardDataTokens.typography.label.fontFamily,
              fontSize: 13,
              lineHeight: 1.12,
              fontWeight: 760,
            }}
          >
            <div>{fixture.operations.columns.queue}</div>
            <div>{fixture.operations.columns.owner}</div>
            <div>{fixture.operations.columns.window}</div>
            <div>{fixture.operations.columns.status}</div>
          </div>
          <div
            style={{
              display: "grid",
            }}
          >
            {fixture.operations.rows.map((row, index) => (
              <OperationRow
                key={`${row.queue}-${row.status}`}
                row={row}
                index={index}
                frame={frame}
                policy={fixture.motionPolicy}
              />
            ))}
          </div>
          <div
            style={drawText({
              marginTop: 10,
              color: dashboardDataTokens.color.textSoft,
              fontFamily: dashboardDataTokens.typography.caption.fontFamily,
              fontSize: 13,
              lineHeight: 1.22,
              fontWeight: dashboardDataTokens.typography.caption.fontWeight,
            })}
          >
            {fixture.operations.footer}
          </div>
        </>
      ) : fixture.operations.stateMessage ? (
        <div style={{ marginTop: 16 }}>
          <PanelStateView
            state={fixture.operations.state}
            message={fixture.operations.stateMessage}
            frame={frame}
            policy={fixture.motionPolicy}
            mode="compact"
          />
        </div>
      ) : null}
    </div>
  </BoxFrame>
);

export const DashboardDataScene = ({
  sceneKey,
}: {
  sceneKey: DashboardDataFixtureKey;
}) => {
  const frame = useCurrentFrame();
  const fixture = dashboardDataFixtures[sceneKey];
  const layoutProfile = layoutProfiles[sceneKey];
  const layout = resolveVerticalLayout({
    platform: "tiktok",
    safeArea: dashboardDataTokens.safeArea,
    maxContentWidth: dashboardDataTokens.grid.maxContentWidth,
  });
  const columns = resolveColumns(
    layout.content,
    dashboardDataTokens.grid.columns,
    dashboardDataTokens.grid.gutter,
  );
  const headerBox = makeBox(
    layout.content.x,
    layout.content.y,
    layout.content.width,
    headerHeight,
  );
  const kpiBox = makeBox(
    layout.content.x,
    headerBox.y + headerBox.height + panelGap,
    layout.content.width,
    layoutProfile.kpiHeight,
  );
  const midTop = kpiBox.y + kpiBox.height + panelGap;
  const chartBox = makeBox(
    spanColumns(columns, 0, 7).x,
    midTop,
    spanColumns(columns, 0, 7).width,
    layoutProfile.midHeight,
  );
  const watchBox = makeBox(
    spanColumns(columns, 7, 5).x,
    midTop,
    spanColumns(columns, 7, 5).width,
    layoutProfile.midHeight,
  );
  const operationsTop = midTop + layoutProfile.midHeight + panelGap;
  const operationsBox = makeBox(
    layout.content.x,
    operationsTop,
    layout.content.width,
    layout.content.y + layout.content.height - operationsTop,
  );
  const titleFit = fitTypographyToBox({
    tokens: dashboardDataTokens,
    role: "headline",
    text: fixture.title,
    width: headerBox.width - 304,
    height: 126,
    maxLines: 3,
    density: fixture.density,
    minScale: 0.68,
  });
  const summaryFit = fitTypographyToBox({
    tokens: dashboardDataTokens,
    role: "body",
    text: fixture.summary,
    width: headerBox.width - 304,
    height: 68,
    maxLines: 3,
    density: fixture.density,
    minScale: 0.68,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${dashboardDataTokens.color.canvas} 0%, ${dashboardDataTokens.color.canvasRaised} 100%)`,
        color: dashboardDataTokens.color.textStrong,
        fontFamily: dashboardDataTokens.typography.body.fontFamily,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: [
            `linear-gradient(to right, ${withAlpha(dashboardDataTokens.color.textStrong, 0.025)} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${withAlpha(dashboardDataTokens.color.textStrong, 0.025)} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "96px 96px",
          opacity: 0.55,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.08) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: layout.safe.x,
          top: layout.safe.y - 26,
          width: layout.safe.width,
          height: 2,
          background: `linear-gradient(90deg, ${dashboardDataTokens.color.accent} 0%, ${withAlpha(dashboardDataTokens.color.accent, 0)} 64%)`,
        }}
      />
      <BoxFrame box={headerBox}>
        <div
          style={{
            ...buildEntranceStyle({
              frame,
              durationInFrames: dashboardDataTokens.motion.normalFrames,
              preset: "fade-up",
              distance: dashboardDataTokens.motion.distanceMd,
              policy: fixture.motionPolicy,
            }),
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 280px",
            gap: 20,
            height: "100%",
          }}
        >
          <div>
            <SectionEyebrow>{fixture.eyebrow}</SectionEyebrow>
            <div
              style={drawText({
                marginTop: 12,
                color: dashboardDataTokens.color.textStrong,
                fontFamily: titleFit.style.fontFamily,
                fontSize: titleFit.style.fontSize,
                lineHeight: titleFit.style.lineHeight,
                fontWeight: titleFit.style.fontWeight,
                maxWidth: headerBox.width - 304,
              })}
            >
              {fixture.title}
            </div>
            <div
              style={drawText({
                marginTop: 10,
                color: dashboardDataTokens.color.textMuted,
                fontFamily: summaryFit.style.fontFamily,
                fontSize: summaryFit.style.fontSize,
                lineHeight: summaryFit.style.lineHeight,
                fontWeight: summaryFit.style.fontWeight,
                maxWidth: headerBox.width - 304,
              })}
            >
              {fixture.summary}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              alignContent: "start",
            }}
          >
            <StatusChip label="Scene" value={fixture.sceneLabel} tone="neutral" />
            {fixture.contextItems.map((item) => (
              <StatusChip
                key={`${item.label}-${item.value}`}
                label={item.label}
                value={item.value}
                tone="neutral"
              />
            ))}
          </div>
        </div>
      </BoxFrame>
      <KpiPanel fixture={fixture} box={kpiBox} frame={frame} />
      <ChartPanel fixture={fixture} box={chartBox} frame={frame} />
      <WatchlistPanel
        items={fixture.watchlist.items}
        title={fixture.watchlist.title}
        subtitle={fixture.watchlist.subtitle}
        box={watchBox}
        frame={frame}
        policy={fixture.motionPolicy}
      />
      <OperationsPanel fixture={fixture} box={operationsBox} frame={frame} />
    </AbsoluteFill>
  );
};
