import { interpolate, useCurrentFrame } from "remotion";
import { mechanismFontFamily } from "./font";
import { FONT_SIZE_WHITELIST, mechanismTokens } from "./tokens";

export type DiffTone = "error" | "correction";

export type DiffSpan = {
  text: string;
  highlight?: DiffTone;
  annotation?: string;
};

export type DiffHighlightProps = {
  before: readonly DiffSpan[];
  after: readonly DiffSpan[];
  beforeLabel?: string;
  afterLabel?: string;
  revealStartFrame?: number;
  revealDurationInFrames?: number;
};

export const DIFF_HIGHLIGHT_DEFAULTS = Object.freeze({
  beforeLabel: "BEFORE",
  afterLabel: "AFTER",
  revealStartFrame: 12,
  revealDurationInFrames: 24,
});

const DiffText: React.FC<{
  spans: readonly DiffSpan[];
  label: string;
  kind: "before" | "after";
  reveal: number;
}> = ({ spans, label, kind, reveal }) => (
  <div
    style={{
      flex: 1,
      minHeight: 388,
      padding: "36px 38px 42px",
      borderRadius: mechanismTokens.radius.panel,
      border: `2px solid ${kind === "before" ? mechanismTokens.color.vermilion : mechanismTokens.color.champagneGold}`,
      backgroundColor:
        kind === "before" ? "#EFE3D6" : mechanismTokens.color.ivory,
      color: mechanismTokens.color.graphite,
      opacity: kind === "after" ? 0.35 + reveal * 0.65 : 1,
      transform:
        kind === "after" ? `translateY(${(1 - reveal) * 20}px)` : undefined,
    }}
  >
    <div
      style={{
        marginBottom: 30,
        color: kind === "before" ? mechanismTokens.color.vermilion : "#806733",
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: 4,
      }}
    >
      {label}
    </div>
    <div lang="ja" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.75 }}>
      {spans.map((span, index) => {
        const activeColor =
          span.highlight === "error"
            ? mechanismTokens.color.vermilion
            : mechanismTokens.color.champagneGold;
        return (
          <span
            key={`${span.text}-${index}`}
            style={{ position: "relative", display: "inline" }}
          >
            <span
              style={{
                padding: span.highlight ? "2px 5px" : 0,
                borderRadius: 7,
                color:
                  span.highlight === "error"
                    ? mechanismTokens.color.vermilion
                    : undefined,
                backgroundColor: span.highlight
                  ? `${activeColor}38`
                  : undefined,
                boxShadow: span.highlight
                  ? `inset 0 -3px 0 ${activeColor}`
                  : undefined,
              }}
            >
              {span.text}
            </span>
            {span.annotation ? (
              <span
                style={{
                  display: "inline-block",
                  margin: "0 7px",
                  padding: "3px 8px",
                  transform: "translateY(-12px)",
                  borderRadius: mechanismTokens.radius.pill,
                  color: activeColor,
                  border: `1px solid ${activeColor}`,
                  fontSize: FONT_SIZE_WHITELIST.diffAnnotation.fontSize,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                {span.annotation}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  </div>
);

export const DiffHighlight: React.FC<DiffHighlightProps> = ({
  before,
  after,
  beforeLabel = DIFF_HIGHLIGHT_DEFAULTS.beforeLabel,
  afterLabel = DIFF_HIGHLIGHT_DEFAULTS.afterLabel,
  revealStartFrame = DIFF_HIGHLIGHT_DEFAULTS.revealStartFrame,
  revealDurationInFrames = DIFF_HIGHLIGHT_DEFAULTS.revealDurationInFrames,
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(
    frame,
    [revealStartFrame, revealStartFrame + Math.max(1, revealDurationInFrames)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        width: 980,
        display: "flex",
        gap: 24,
        fontFamily: mechanismFontFamily,
      }}
    >
      <DiffText
        spans={before}
        label={beforeLabel}
        kind="before"
        reveal={reveal}
      />
      <DiffText spans={after} label={afterLabel} kind="after" reveal={reveal} />
    </div>
  );
};
