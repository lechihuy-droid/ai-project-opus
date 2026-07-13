import type { CSSProperties } from "react";

export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepPartial<Item>[]
    : T extends object
      ? { [Key in keyof T]?: DeepPartial<T[Key]> }
      : T;

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type VerticalPlatformId =
  | "generic"
  | "tiktok"
  | "reels"
  | "youtube-shorts";

export type MotionPolicy = "full" | "reduce" | "static";

export type SemanticTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "inverse";

export type TextDensity = "sparse" | "balanced" | "dense";

export type MediaKind = "image" | "video" | "audio" | "graphic" | "unknown";

export type MediaFit = "cover" | "contain";

export type TypographyRole =
  | "display"
  | "headline"
  | "title"
  | "body"
  | "label"
  | "caption"
  | "mono";

export type ColorRole =
  | "canvas"
  | "canvasRaised"
  | "surface"
  | "surfaceElevated"
  | "surfaceOverlay"
  | "textStrong"
  | "textMuted"
  | "textSoft"
  | "accent"
  | "accentSoft"
  | "success"
  | "warning"
  | "danger"
  | "rule"
  | "shadow"
  | "placeholder";

export type SurfaceElevation = "base" | "raised" | "overlay";

export type StyleObject = CSSProperties;
