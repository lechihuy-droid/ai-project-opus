import type { CSSProperties, PropsWithChildren } from "react";
import { resolveTonePalette, type StyleCoreTokens } from "./tokens";
import type { Box, SemanticTone, SurfaceElevation } from "./types";

type SurfaceProps = PropsWithChildren<{
  tokens: StyleCoreTokens;
  tone?: SemanticTone;
  elevation?: SurfaceElevation;
  padding?: number;
  style?: CSSProperties;
}>;

type BoxFrameProps = PropsWithChildren<{
  box: Box;
  style?: CSSProperties;
}>;

type GridProps = PropsWithChildren<{
  columns?: number;
  gap?: number;
  rowGap?: number;
  alignItems?: CSSProperties["alignItems"];
  style?: CSSProperties;
}>;

type GridCellProps = PropsWithChildren<{
  columnSpan?: number;
  rowSpan?: number;
  columnStart?: number;
  rowStart?: number;
  minHeight?: number;
  style?: CSSProperties;
}>;

const resolveSurfaceShadow = (
  tokens: StyleCoreTokens,
  elevation: SurfaceElevation,
) => {
  if (elevation === "raised") {
    return tokens.surface.shadowRaised;
  }

  if (elevation === "overlay") {
    return tokens.surface.shadowOverlay;
  }

  return tokens.surface.shadowBase;
};

export const BoxFrame = ({ box, style, children }: BoxFrameProps) => (
  <div
    style={{
      position: "absolute",
      left: box.x,
      top: box.y,
      width: box.width,
      height: box.height,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Surface = ({
  tokens,
  tone = "neutral",
  elevation = "base",
  padding = tokens.spacing.lg,
  style,
  children,
}: SurfaceProps) => {
  const palette = resolveTonePalette(tokens, tone);

  return (
    <div
      style={{
        background: elevation === "overlay" ? tokens.color.surfaceOverlay : palette.background,
        color: palette.text,
        border: `${tokens.surface.borderWidth}px solid ${palette.border}`,
        borderRadius: elevation === "base" ? tokens.radius.lg : tokens.radius.xl,
        boxShadow: `${resolveSurfaceShadow(tokens, elevation)}, ${tokens.surface.highlight}`,
        padding,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Grid = ({
  columns = 12,
  gap = 24,
  rowGap = gap,
  alignItems = "stretch",
  style,
  children,
}: GridProps) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap,
      rowGap,
      alignItems,
      ...style,
    }}
  >
    {children}
  </div>
);

export const GridCell = ({
  columnSpan = 1,
  rowSpan = 1,
  columnStart,
  rowStart,
  minHeight,
  style,
  children,
}: GridCellProps) => (
  <div
    style={{
      gridColumn: columnStart
        ? `${columnStart} / span ${columnSpan}`
        : `span ${columnSpan}`,
      gridRow: rowStart ? `${rowStart} / span ${rowSpan}` : `span ${rowSpan}`,
      minHeight,
      ...style,
    }}
  >
    {children}
  </div>
);
