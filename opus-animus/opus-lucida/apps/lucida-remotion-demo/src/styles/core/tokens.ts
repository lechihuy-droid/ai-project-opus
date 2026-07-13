import type { CSSProperties } from "react";
import type {
  ColorRole,
  DeepPartial,
  MotionPolicy,
  SemanticTone,
  TypographyRole,
} from "./types";

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: CSSProperties["fontWeight"];
  letterSpacing: number;
  textTransform?: CSSProperties["textTransform"];
};

export type TonePalette = {
  background: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  shadow: string;
};

export type StyleCoreTokens = {
  meta: {
    familyId: string;
    version: string;
  };
  color: Record<ColorRole, string>;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    gutter: number;
    safeMargin: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  grid: {
    columns: number;
    gutter: number;
    rowGap: number;
    outerMargin: number;
    maxContentWidth: number;
  };
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    captionBottom: number;
  };
  motion: {
    policy: MotionPolicy;
    fastFrames: number;
    normalFrames: number;
    slowFrames: number;
    distanceSm: number;
    distanceMd: number;
    distanceLg: number;
  };
  surface: {
    borderWidth: number;
    shadowBase: string;
    shadowRaised: string;
    shadowOverlay: string;
    highlight: string;
  };
  media: {
    cornerRadius: number;
    frameInset: number;
    placeholderGrid: number;
    placeholderLabel: string;
  };
  typography: Record<TypographyRole, TypographyToken>;
};

const BASE_TOKENS: StyleCoreTokens = {
  meta: {
    familyId: "shared-core",
    version: "0.1.0",
  },
  color: {
    canvas: "#07111f",
    canvasRaised: "#0d1728",
    surface: "#101c2b",
    surfaceElevated: "#152336",
    surfaceOverlay: "rgba(7, 11, 19, 0.78)",
    textStrong: "#f4f7fb",
    textMuted: "#b6c3d1",
    textSoft: "#7f91a6",
    accent: "#7dd3fc",
    accentSoft: "rgba(125, 211, 252, 0.16)",
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#fb7185",
    rule: "rgba(255, 255, 255, 0.12)",
    shadow: "rgba(0, 0, 0, 0.34)",
    placeholder: "#536170",
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 40,
    gutter: 24,
    safeMargin: 72,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  grid: {
    columns: 12,
    gutter: 24,
    rowGap: 24,
    outerMargin: 72,
    maxContentWidth: 936,
  },
  safeArea: {
    top: 160,
    right: 72,
    bottom: 220,
    left: 72,
    captionBottom: 312,
  },
  motion: {
    policy: "full",
    fastFrames: 10,
    normalFrames: 18,
    slowFrames: 28,
    distanceSm: 14,
    distanceMd: 26,
    distanceLg: 42,
  },
  surface: {
    borderWidth: 1,
    shadowBase: "0 18px 42px rgba(0, 0, 0, 0.18)",
    shadowRaised: "0 24px 56px rgba(0, 0, 0, 0.26)",
    shadowOverlay: "0 28px 64px rgba(0, 0, 0, 0.34)",
    highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  },
  media: {
    cornerRadius: 24,
    frameInset: 18,
    placeholderGrid: 28,
    placeholderLabel: "Missing asset",
  },
  typography: {
    display: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 96,
      lineHeight: 1.02,
      fontWeight: 900,
      letterSpacing: 0,
      textTransform: "none",
    },
    headline: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 60,
      lineHeight: 1.08,
      fontWeight: 850,
      letterSpacing: 0,
      textTransform: "none",
    },
    title: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 38,
      lineHeight: 1.14,
      fontWeight: 800,
      letterSpacing: 0,
      textTransform: "none",
    },
    body: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 26,
      lineHeight: 1.34,
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: "none",
    },
    label: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 22,
      lineHeight: 1.18,
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "uppercase",
    },
    caption: {
      fontFamily: '"Be Vietnam Pro", sans-serif',
      fontSize: 20,
      lineHeight: 1.26,
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: "none",
    },
    mono: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 22,
      lineHeight: 1.32,
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: "none",
    },
  },
};

const mergeTypographyToken = (
  base: TypographyToken,
  overrides?: Partial<TypographyToken>,
): TypographyToken => ({
  fontFamily: overrides?.fontFamily ?? base.fontFamily,
  fontSize: overrides?.fontSize ?? base.fontSize,
  lineHeight: overrides?.lineHeight ?? base.lineHeight,
  fontWeight: overrides?.fontWeight ?? base.fontWeight,
  letterSpacing: overrides?.letterSpacing ?? base.letterSpacing,
  textTransform: overrides?.textTransform ?? base.textTransform,
});

const mergeTypography = (
  base: Record<TypographyRole, TypographyToken>,
  overrides?: DeepPartial<Record<TypographyRole, TypographyToken>>,
): Record<TypographyRole, TypographyToken> => ({
  display: mergeTypographyToken(base.display, overrides?.display as Partial<TypographyToken> | undefined),
  headline: mergeTypographyToken(base.headline, overrides?.headline as Partial<TypographyToken> | undefined),
  title: mergeTypographyToken(base.title, overrides?.title as Partial<TypographyToken> | undefined),
  body: mergeTypographyToken(base.body, overrides?.body as Partial<TypographyToken> | undefined),
  label: mergeTypographyToken(base.label, overrides?.label as Partial<TypographyToken> | undefined),
  caption: mergeTypographyToken(base.caption, overrides?.caption as Partial<TypographyToken> | undefined),
  mono: mergeTypographyToken(base.mono, overrides?.mono as Partial<TypographyToken> | undefined),
});

export const createStyleCoreTokens = (
  overrides: DeepPartial<StyleCoreTokens> = {},
): StyleCoreTokens => ({
  meta: { ...BASE_TOKENS.meta, ...overrides.meta },
  color: { ...BASE_TOKENS.color, ...overrides.color },
  spacing: { ...BASE_TOKENS.spacing, ...overrides.spacing },
  radius: { ...BASE_TOKENS.radius, ...overrides.radius },
  grid: { ...BASE_TOKENS.grid, ...overrides.grid },
  safeArea: { ...BASE_TOKENS.safeArea, ...overrides.safeArea },
  motion: { ...BASE_TOKENS.motion, ...overrides.motion },
  surface: { ...BASE_TOKENS.surface, ...overrides.surface },
  media: { ...BASE_TOKENS.media, ...overrides.media },
  typography: mergeTypography(BASE_TOKENS.typography, overrides.typography),
});

export const defaultStyleCoreTokens = Object.freeze(createStyleCoreTokens());

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const expandHex = (value: string) =>
  value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;

const parseHex = (value: string) => {
  const normalized = expandHex(value);
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const parseRgb = (value: string) => {
  const match = value.match(
    /^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    r: clampByte(Number(match[1])),
    g: clampByte(Number(match[2])),
    b: clampByte(Number(match[3])),
  };
};

export const withAlpha = (color: string, alpha: number) => {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  const rgb = parseHex(color) ?? parseRgb(color);

  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalizedAlpha})`;
};

export const resolveSemanticColor = (
  tokens: StyleCoreTokens,
  role: ColorRole,
) => tokens.color[role];

export const resolveTypographyToken = (
  tokens: StyleCoreTokens,
  role: TypographyRole,
  overrides: Partial<TypographyToken> = {},
): TypographyToken => ({
  ...tokens.typography[role],
  ...overrides,
});

export const resolveTonePalette = (
  tokens: StyleCoreTokens,
  tone: SemanticTone,
): TonePalette => {
  if (tone === "accent") {
    return {
      background: withAlpha(tokens.color.accent, 0.16),
      border: withAlpha(tokens.color.accent, 0.4),
      text: tokens.color.textStrong,
      mutedText: tokens.color.textMuted,
      accent: tokens.color.accent,
      shadow: withAlpha(tokens.color.accent, 0.22),
    };
  }

  if (tone === "success") {
    return {
      background: withAlpha(tokens.color.success, 0.14),
      border: withAlpha(tokens.color.success, 0.36),
      text: tokens.color.textStrong,
      mutedText: tokens.color.textMuted,
      accent: tokens.color.success,
      shadow: withAlpha(tokens.color.success, 0.2),
    };
  }

  if (tone === "warning") {
    return {
      background: withAlpha(tokens.color.warning, 0.14),
      border: withAlpha(tokens.color.warning, 0.34),
      text: tokens.color.textStrong,
      mutedText: tokens.color.textMuted,
      accent: tokens.color.warning,
      shadow: withAlpha(tokens.color.warning, 0.18),
    };
  }

  if (tone === "danger") {
    return {
      background: withAlpha(tokens.color.danger, 0.15),
      border: withAlpha(tokens.color.danger, 0.38),
      text: tokens.color.textStrong,
      mutedText: tokens.color.textMuted,
      accent: tokens.color.danger,
      shadow: withAlpha(tokens.color.danger, 0.24),
    };
  }

  if (tone === "inverse") {
    return {
      background: tokens.color.textStrong,
      border: withAlpha(tokens.color.textStrong, 0.42),
      text: tokens.color.canvas,
      mutedText: tokens.color.canvasRaised,
      accent: tokens.color.canvas,
      shadow: withAlpha(tokens.color.shadow, 0.12),
    };
  }

  return {
    background: tokens.color.surface,
    border: tokens.color.rule,
    text: tokens.color.textStrong,
    mutedText: tokens.color.textMuted,
    accent: tokens.color.accent,
    shadow: tokens.color.shadow,
  };
};
