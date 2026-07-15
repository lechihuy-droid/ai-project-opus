import { useCurrentFrame } from "remotion";
import { mechanismFontFamily } from "./font";
import { mechanismTokens } from "./tokens";

export type MechanismWindowVariant = "email" | "chat" | "doc";
export type MechanismWindowState = "draft" | "sent";

export type MechanismWindowProps = {
  variant: MechanismWindowVariant;
  title: string;
  japaneseText: string;
  vietnameseText: string;
  state?: MechanismWindowState;
  showCursor?: boolean;
  cursorBlinkFrames?: number;
};

export const MECHANISM_WINDOW_DEFAULTS = Object.freeze({
  state: "draft" as const,
  showCursor: true,
  cursorBlinkFrames: 16,
});

const variantLabel: Record<MechanismWindowVariant, string> = {
  email: "MAIL",
  chat: "CHAT",
  doc: "DOCUMENT",
};

const variantGlyph: Record<MechanismWindowVariant, string> = {
  email: "@",
  chat: "…",
  doc: "¶",
};

export const MechanismWindow: React.FC<MechanismWindowProps> = ({
  variant,
  title,
  japaneseText,
  vietnameseText,
  state = MECHANISM_WINDOW_DEFAULTS.state,
  showCursor = MECHANISM_WINDOW_DEFAULTS.showCursor,
  cursorBlinkFrames = MECHANISM_WINDOW_DEFAULTS.cursorBlinkFrames,
}) => {
  const frame = useCurrentFrame();
  const safeBlinkFrames = Math.max(2, Math.round(cursorBlinkFrames));
  const cursorVisible =
    state === "draft" &&
    showCursor &&
    frame % safeBlinkFrames < safeBlinkFrames / 2;

  return (
    <div
      style={{
        width: 920,
        overflow: "hidden",
        borderRadius: mechanismTokens.radius.window,
        border: `2px solid ${mechanismTokens.color.champagneGold}`,
        backgroundColor: mechanismTokens.color.ivory,
        boxShadow: "0 38px 90px rgba(0, 0, 0, 0.34)",
        color: mechanismTokens.color.graphite,
        fontFamily: mechanismFontFamily,
      }}
    >
      <div
        style={{
          minHeight: 96,
          padding: "0 34px",
          display: "flex",
          alignItems: "center",
          gap: 22,
          color: mechanismTokens.color.ivory,
          backgroundColor: mechanismTokens.color.graphiteSoft,
          borderBottom: `2px solid ${mechanismTokens.color.champagneGold}`,
        }}
      >
        <div style={{ display: "flex", gap: 10 }} aria-hidden="true">
          {[
            mechanismTokens.color.vermilion,
            mechanismTokens.color.champagneGold,
            mechanismTokens.color.ivoryMuted,
          ].map((color) => (
            <span
              key={color}
              style={{
                width: 17,
                height: 17,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${mechanismTokens.color.champagneGold}`,
            color: mechanismTokens.color.champagneGold,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {variantGlyph[variant]}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 3 }}>
            {variantLabel[variant]}
          </div>
          <div
            style={{
              overflow: "hidden",
              color: mechanismTokens.color.ivoryMuted,
              fontSize: 32,
              lineHeight: 1.2,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            borderRadius: mechanismTokens.radius.pill,
            padding: "10px 20px",
            color:
              state === "sent"
                ? mechanismTokens.color.graphite
                : mechanismTokens.color.champagneGold,
            backgroundColor:
              state === "sent"
                ? mechanismTokens.color.champagneGold
                : "transparent",
            border: `2px solid ${mechanismTokens.color.champagneGold}`,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          {state === "sent" ? "SENT" : "DRAFT"}
        </div>
      </div>

      <div style={{ padding: "48px 52px 54px" }}>
        <div
          lang="ja"
          style={{
            minHeight: 174,
            whiteSpace: "pre-wrap",
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1.55,
            letterSpacing: 0.5,
          }}
        >
          {japaneseText}
          {cursorVisible ? (
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: 48,
                marginLeft: 7,
                verticalAlign: "text-bottom",
                backgroundColor: mechanismTokens.color.vermilion,
              }}
            />
          ) : null}
        </div>
        <div
          style={{
            marginTop: 30,
            paddingTop: 28,
            borderTop: `2px solid ${mechanismTokens.color.champagneGold}`,
            color: mechanismTokens.color.graphiteSoft,
            whiteSpace: "pre-wrap",
            fontSize: 34,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {vietnameseText}
        </div>
      </div>
    </div>
  );
};
