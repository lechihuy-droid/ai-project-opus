import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { mechanismFontFamily } from "./font";
import { mechanismTokens } from "./tokens";

export type RelativePoint = {
  x: number;
  y: number;
};

export type ContextChipProps = {
  label: string;
  value: string;
  target: RelativePoint;
  from?: RelativePoint;
  startFrame?: number;
  durationInFrames?: number;
};

export const CONTEXT_CHIP_DEFAULTS = Object.freeze({
  from: { x: 0.14, y: 0.72 },
  startFrame: 0,
  durationInFrames: 30,
});

const clampRelative = (value: number) => Math.max(0, Math.min(1, value));

export const ContextChip: React.FC<ContextChipProps> = ({
  label,
  value,
  target,
  from = CONTEXT_CHIP_DEFAULTS.from,
  startFrame = CONTEXT_CHIP_DEFAULTS.startFrame,
  durationInFrames = CONTEXT_CHIP_DEFAULTS.durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const endFrame = startFrame + Math.max(1, durationInFrames);
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - (1 - progress) ** 3;
  const x = interpolate(
    eased,
    [0, 1],
    [clampRelative(from.x), clampRelative(target.x)],
  );
  const y = interpolate(
    eased,
    [0, 1],
    [clampRelative(from.y), clampRelative(target.y)],
  );
  const lift = Math.sin(progress * Math.PI) * 68;

  return (
    <div
      style={{
        position: "absolute",
        left: x * width,
        top: y * height - lift,
        transform: `translate(-50%, -50%) scale(${0.9 + eased * 0.1})`,
        opacity: interpolate(progress, [0, 0.12, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "18px 28px 18px 20px",
        borderRadius: mechanismTokens.radius.pill,
        border: `2px solid ${mechanismTokens.color.champagneGold}`,
        backgroundColor: mechanismTokens.color.ivory,
        boxShadow: `0 20px 48px rgba(0, 0, 0, ${0.16 + eased * 0.14})`,
        color: mechanismTokens.color.graphite,
        fontFamily: mechanismFontFamily,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: mechanismTokens.color.ivory,
          backgroundColor: mechanismTokens.color.graphite,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        +
      </span>
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: mechanismTokens.color.vermilion,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 36, fontWeight: 600 }}>{value}</span>
    </div>
  );
};
