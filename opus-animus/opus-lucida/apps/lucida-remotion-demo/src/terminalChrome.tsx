import { interpolate } from "remotion";
import { useSkin, withAlpha } from "./skins";

/**
 * Typewriter reveal. Implements the motion-library `line_typewriter` token.
 * Pattern: interpolate frame -> visible characters (see
 * apps/remotion-templates/templates/typewriter-subtitle.tsx).
 */
export const useTypewriter = (
  text: string,
  frame: number,
  options?: { charsPerFrame?: number; startFrame?: number },
) => {
  const charsPerFrame = options?.charsPerFrame ?? 2;
  const startFrame = options?.startFrame ?? 0;
  const durationFrames = Math.max(1, Math.ceil(text.length / charsPerFrame));
  const visibleChars = Math.floor(
    interpolate(
      frame,
      [startFrame, startFrame + durationFrames],
      [0, text.length],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );

  return {
    text: text.slice(0, visibleChars),
    done: visibleChars >= text.length,
  };
};

/**
 * Blinking block cursor. Implements the motion-library `cursor_blink` token.
 * Blink cadence: frame % 15 < 7 (same as typewriter-subtitle.tsx).
 */
export const Cursor: React.FC<{
  frame: number;
  color: string;
  fontSize?: number;
}> = ({ frame, color, fontSize }) => (
  <span
    style={{
      color,
      opacity: frame % 15 < 7 ? 1 : 0,
      marginLeft: "0.08em",
      fontSize,
    }}
  >
    ▌
  </span>
);

/**
 * Terminal window frame drawn around the scene content. Active only when
 * skin.chrome.terminalFrame is true (modern-terminal skin). Rendered behind
 * the scene content so the existing absolute layout is untouched.
 */
export const TerminalFrame: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const skin = useSkin();

  return (
    <div
      style={{
        position: "absolute",
        inset: 20,
        borderRadius: 20,
        border: `1px solid ${skin.palette.border}`,
        background: withAlpha("16,21,27", 0.5),
        boxShadow: `0 0 44px ${withAlpha(skin.palette.accentRgb, 0.08)}, inset 0 0 60px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        fontFamily: skin.palette.fontMono,
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: `1px solid ${skin.palette.border}`,
          background: withAlpha("21,27,35", 0.72),
        }}
      >
        <div style={{ display: "flex", gap: 10, marginRight: 18 }}>
          {["#ff6b5f", "#ffbd4a", "#44d07b"].map((color) => (
            <div
              key={color}
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            color: withAlpha(skin.palette.textPrimaryRgb, 0.72),
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          {`~/lucida — ${sceneId}`}
        </div>
      </div>
    </div>
  );
};

/**
 * Very faint CRT scanline overlay, rendered above scene content.
 */
export const ScanlineOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 21,
      borderRadius: 20,
      pointerEvents: "none",
      backgroundImage:
        "repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0px, rgba(0,0,0,0.20) 1px, transparent 1px, transparent 4px)",
      opacity: 0.22,
      mixBlendMode: "multiply",
    }}
  />
);
