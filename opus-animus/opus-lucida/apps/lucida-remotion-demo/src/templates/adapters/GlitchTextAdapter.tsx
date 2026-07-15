import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import type { TemplateAdapterProps } from "../../templateRegistry";

const normalizeText = (text: string | undefined) => (text ?? "").normalize("NFC");

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const headlineMetrics = (graphemeCount: number, width: number, height: number) => {
  const scale = width / 1080;
  const safeInsetX = Math.ceil(width * 0.11);
  const rgbOffsetLimit = Math.ceil(width * 0.006);
  const boxWidth = width - 2 * (safeInsetX + rgbOffsetLimit);
  const boxHeight = Math.round(height * 0.3);
  const targetLineCount = clamp(Math.ceil(graphemeCount / 24), 2, 5);
  const graphemesPerLine = Math.ceil(graphemeCount / targetLineCount);
  const widthBound = boxWidth / Math.max(1, graphemesPerLine * 0.63);
  const heightBound = boxHeight / (targetLineCount * 1.06);

  return {
    boxHeight,
    boxWidth,
    fontSize: clamp(Math.min(widthBound, heightBound), 46 * scale, 78 * scale),
    rgbOffsetLimit,
    safeInsetX,
  };
};

export const GlitchTextAdapter: React.FC<TemplateAdapterProps> = ({
  scene,
  localFrame,
  durationFrames,
}) => {
  const { width, height } = useVideoConfig();
  const headline = normalizeText(scene.headline);
  const supportingText = normalizeText(
    scene.content.subtitle ?? scene.content.quote ?? scene.content.codeTitle,
  );
  const graphemeCount = Array.from(headline).length;
  const { boxHeight, boxWidth, fontSize: headlineSize, rgbOffsetLimit, safeInsetX } = headlineMetrics(
    graphemeCount,
    width,
    height,
  );
  const safeTop = Math.ceil(height * 0.12);
  const safeBottom = Math.ceil(height * 0.16);
  const enter = interpolate(localFrame, [0, 10, 22], [0, 0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    localFrame,
    [Math.max(0, durationFrames - 12), Math.max(1, durationFrames - 1)],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const visibility = Math.min(enter, exit);
  const rgbOffset = Math.sin(localFrame / 4.5) * rgbOffsetLimit;
  const tearOffset = Math.sin(localFrame / 9) * height * 0.004;
  const scanlineY = (localFrame * height * 0.018) % height;

  const headlineTextStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    fontSize: headlineSize,
    fontWeight: 900,
    lineHeight: 1.03,
    letterSpacing: 0,
    textAlign: "center",
    overflowWrap: "break-word",
    wordBreak: "normal",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0d12",
        overflow: "hidden",
        opacity: visibility,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: scanlineY,
          left: safeInsetX,
          right: safeInsetX,
          height: Math.max(2, height * 0.002),
          backgroundColor: "rgba(238, 248, 255, 0.22)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: safeTop,
          bottom: safeBottom,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: boxWidth,
            height: boxHeight,
            overflow: "hidden",
            transform: `translateY(${tearOffset}px)`,
          }}
        >
          <div
            style={{
              ...headlineTextStyle,
              color: "#00e5ff",
              opacity: 0.72,
              transform: `translate(${rgbOffset}px, ${tearOffset}px)`,
              mixBlendMode: "screen",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              ...headlineTextStyle,
              color: "#ff3eb5",
              opacity: 0.66,
              transform: `translate(${-rgbOffset}px, ${-tearOffset}px)`,
              mixBlendMode: "screen",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              ...headlineTextStyle,
              color: "#f4f7fb",
              textShadow: "0 0 18px rgba(244, 247, 251, 0.2)",
            }}
          >
            {headline}
          </div>
        </div>
        {supportingText ? (
          <div
            style={{
              maxWidth: width * 0.78,
              maxHeight: height * 0.12,
              marginTop: height * 0.035,
              color: "rgba(244, 247, 251, 0.78)",
              fontFamily: "Arial, sans-serif",
              fontSize: Math.min(30, width * 0.027),
              fontWeight: 600,
              lineHeight: 1.32,
              letterSpacing: 0,
              textAlign: "center",
              overflow: "hidden",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
            }}
          >
            {supportingText}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
