import type { CSSProperties } from "react";
import { Img } from "remotion";
import { resolveTonePalette, withAlpha, type StyleCoreTokens } from "./tokens";
import type { MediaFit, MediaKind, SemanticTone } from "./types";

export type MissingAssetPlaceholderProps = {
  tokens: StyleCoreTokens;
  kind?: MediaKind;
  label?: string;
  reason?: string;
  tone?: SemanticTone;
  style?: CSSProperties;
};

export type MediaFrameProps = {
  tokens: StyleCoreTokens;
  src?: string;
  alt?: string;
  fit?: MediaFit;
  kind?: MediaKind;
  tone?: SemanticTone;
  status?: "ready" | "missing";
  label?: string;
  reason?: string;
  overlay?: CSSProperties["background"];
  style?: CSSProperties;
  mediaStyle?: CSSProperties;
};

const glyphForKind = (kind: MediaKind) => {
  if (kind === "video") {
    return "VID";
  }

  if (kind === "audio") {
    return "AUD";
  }

  if (kind === "graphic") {
    return "SVG";
  }

  if (kind === "image") {
    return "IMG";
  }

  return "???";
};

export const MissingAssetPlaceholder = ({
  tokens,
  kind = "image",
  label = tokens.media.placeholderLabel,
  reason = "Attach an embeddable asset or switch to a non asset-led family.",
  tone = "neutral",
  style,
}: MissingAssetPlaceholderProps) => {
  const palette = resolveTonePalette(tokens, tone);
  const gridSize = tokens.media.placeholderGrid;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: tokens.media.cornerRadius,
        overflow: "hidden",
        border: `${tokens.surface.borderWidth}px dashed ${withAlpha(palette.border, 0.85)}`,
        background: [
          `linear-gradient(135deg, ${withAlpha(palette.accent, 0.18)} 0%, transparent 58%)`,
          `linear-gradient(0deg, ${withAlpha(tokens.color.canvasRaised, 0.92)}, ${withAlpha(tokens.color.surface, 0.92)})`,
        ].join(", "),
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            `linear-gradient(to right, ${withAlpha(tokens.color.textStrong, 0.05)} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${withAlpha(tokens.color.textStrong, 0.05)} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 20px, rgba(255,255,255,0.08) 20px 40px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: tokens.spacing.lg,
          right: tokens.spacing.lg,
          top: tokens.spacing.lg,
          bottom: tokens.spacing.lg,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
            borderRadius: tokens.radius.pill,
            background: withAlpha(palette.accent, 0.16),
            color: palette.accent,
            fontFamily: tokens.typography.mono.fontFamily,
            fontSize: tokens.typography.caption.fontSize,
            lineHeight: tokens.typography.caption.lineHeight,
            fontWeight: 700,
          }}
        >
          {glyphForKind(kind)}
        </div>
        <div>
          <div
            style={{
              color: palette.text,
              fontFamily: tokens.typography.title.fontFamily,
              fontSize: tokens.typography.title.fontSize,
              lineHeight: tokens.typography.title.lineHeight,
              fontWeight: tokens.typography.title.fontWeight,
            }}
          >
            {label}
          </div>
          <div
            style={{
              marginTop: tokens.spacing.sm,
              color: palette.mutedText,
              fontFamily: tokens.typography.body.fontFamily,
              fontSize: tokens.typography.body.fontSize,
              lineHeight: tokens.typography.body.lineHeight,
              fontWeight: tokens.typography.body.fontWeight,
              maxWidth: "82%",
            }}
          >
            {reason}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MediaFrame = ({
  tokens,
  src,
  alt = "",
  fit = "cover",
  kind = "image",
  tone = "neutral",
  status = "ready",
  label,
  reason,
  overlay,
  style,
  mediaStyle,
}: MediaFrameProps) => {
  const palette = resolveTonePalette(tokens, tone);
  const showPlaceholder = status !== "ready" || !src;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: tokens.media.cornerRadius,
        overflow: "hidden",
        border: `${tokens.surface.borderWidth}px solid ${palette.border}`,
        background: palette.background,
        boxShadow: tokens.surface.shadowBase,
        ...style,
      }}
    >
      {showPlaceholder ? (
        <MissingAssetPlaceholder
          tokens={tokens}
          kind={kind}
          label={label}
          reason={reason}
          tone={tone}
        />
      ) : (
        <Img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: "center center",
            display: "block",
            ...mediaStyle,
          }}
        />
      )}
      {overlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: overlay,
          }}
        />
      ) : null}
    </div>
  );
};
