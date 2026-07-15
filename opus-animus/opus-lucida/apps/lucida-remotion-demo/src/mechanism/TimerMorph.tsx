import { interpolate, useCurrentFrame } from "remotion";
import { mechanismFontFamily } from "./font";
import { mechanismTokens } from "./tokens";

export type Timecode = `${number}${number}:${number}${number}`;

export type TimerMorphProps = {
  from: Timecode;
  to: Timecode;
  label?: string;
  position?: { left: number; top: number };
  startFrame?: number;
  durationInFrames?: number;
};

export const TIMER_MORPH_DEFAULTS = Object.freeze({
  label: "TIME SAVED",
  position: { left: 115, top: 1020 },
  startFrame: 0,
  durationInFrames: 42,
});

const DigitMorph: React.FC<{ from: string; to: string; progress: number }> = ({
  from,
  to,
  progress,
}) => {
  if (from === to) {
    return <span>{to}</span>;
  }

  const outgoingY = interpolate(progress, [0, 1], [0, -0.72]);
  const incomingY = interpolate(progress, [0, 1], [0.72, 0]);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: "0.64em",
        height: "1.05em",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - progress,
          transform: `translateY(${outgoingY}em)`,
        }}
      >
        {from}
      </span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          opacity: progress,
          transform: `translateY(${incomingY}em)`,
        }}
      >
        {to}
      </span>
    </span>
  );
};

export const TimerMorph: React.FC<TimerMorphProps> = ({
  from,
  to,
  label = TIMER_MORPH_DEFAULTS.label,
  startFrame = TIMER_MORPH_DEFAULTS.startFrame,
  durationInFrames = TIMER_MORPH_DEFAULTS.durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + Math.max(1, durationInFrames)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const eased =
    progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2;

  return (
    <div
      style={{
        width: 850,
        padding: "62px 54px 58px",
        borderRadius: mechanismTokens.radius.window,
        border: `2px solid ${mechanismTokens.color.champagneGold}`,
        backgroundColor: mechanismTokens.color.graphiteSoft,
        boxShadow: "0 38px 90px rgba(0, 0, 0, 0.34)",
        textAlign: "center",
        fontFamily: mechanismFontFamily,
      }}
    >
      <div
        style={{
          color: mechanismTokens.color.champagneGold,
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 6,
        }}
      >
        {label}
      </div>
      <div
        aria-label={`${from} to ${to}`}
        style={{
          marginTop: 22,
          color: mechanismTokens.color.ivory,
          fontSize: 142,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          letterSpacing: -5,
          textShadow: `0 0 38px rgba(210, 180, 122, ${0.1 + eased * 0.25})`,
        }}
      >
        {Array.from(from).map((character, index) =>
          character === ":" ? (
            <span
              key={`colon-${index}`}
              style={{
                display: "inline-block",
                width: "0.34em",
                color: mechanismTokens.color.vermilion,
              }}
            >
              :
            </span>
          ) : (
            <DigitMorph
              key={index}
              from={character}
              to={to[index] ?? character}
              progress={eased}
            />
          ),
        )}
      </div>
      <div
        style={{
          width: `${28 + eased * 72}%`,
          height: 5,
          margin: "38px auto 0",
          borderRadius: mechanismTokens.radius.pill,
          backgroundColor: mechanismTokens.color.champagneGold,
        }}
      />
    </div>
  );
};
