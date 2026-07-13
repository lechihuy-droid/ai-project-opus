import {
  createStyleCoreTokens,
  withAlpha,
  type StyleCoreTokens,
} from "../../core";
import type {
  MinimalEducationAccentTone,
  MinimalEducationScene,
} from "./types";

type AccentPalette = {
  primary: string;
  soft: string;
  strong: string;
  secondary: string;
  tertiary: string;
};

const ACCENT_MAP: Record<MinimalEducationAccentTone, AccentPalette> = {
  blue: {
    primary: "#2563EB",
    soft: "#DBEAFE",
    strong: "#1D4ED8",
    secondary: "#0F766E",
    tertiary: "#D97706",
  },
  teal: {
    primary: "#0F766E",
    soft: "#CCFBF1",
    strong: "#115E59",
    secondary: "#2563EB",
    tertiary: "#E11D48",
  },
  gold: {
    primary: "#B45309",
    soft: "#FEF3C7",
    strong: "#92400E",
    secondary: "#1D4ED8",
    tertiary: "#0F766E",
  },
  coral: {
    primary: "#DC2626",
    soft: "#FEE2E2",
    strong: "#B91C1C",
    secondary: "#0F766E",
    tertiary: "#2563EB",
  },
};

export const resolveAccentPalette = (
  accentTone: MinimalEducationAccentTone,
) => ACCENT_MAP[accentTone];

export const createMinimalEducationTokens = (
  scene: MinimalEducationScene,
): StyleCoreTokens => {
  const accent = resolveAccentPalette(scene.accentTone);

  return createStyleCoreTokens({
    meta: {
      familyId: "minimal-education",
      version: "1.0.0",
    },
    color: {
      canvas: "#F4F1EA",
      canvasRaised: "#ECE7DE",
      surface: "#FBF9F4",
      surfaceElevated: "#FFFFFF",
      surfaceOverlay: withAlpha("#FFFDF9", 0.94),
      textStrong: "#14181F",
      textMuted: "#495463",
      textSoft: "#6F7A89",
      accent: accent.primary,
      accentSoft: accent.soft,
      success: "#0F766E",
      warning: "#B45309",
      danger: "#C2410C",
      rule: "rgba(20, 24, 31, 0.10)",
      shadow: "rgba(20, 24, 31, 0.08)",
      placeholder: "#9AA4B2",
    },
    spacing: {
      xs: 8,
      sm: 14,
      md: 22,
      lg: 32,
      xl: 48,
      gutter: 24,
      safeMargin: 72,
    },
    radius: {
      sm: 6,
      md: 10,
      lg: 16,
      xl: 20,
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
      top: 132,
      right: 72,
      bottom: 184,
      left: 72,
      captionBottom: 288,
    },
    motion: {
      policy: scene.motionPolicy,
      fastFrames: 10,
      normalFrames: 18,
      slowFrames: 28,
      distanceSm: 10,
      distanceMd: 18,
      distanceLg: 24,
    },
    surface: {
      borderWidth: 1,
      shadowBase: "0 10px 30px rgba(20, 24, 31, 0.04)",
      shadowRaised: "0 18px 40px rgba(20, 24, 31, 0.06)",
      shadowOverlay: "0 20px 48px rgba(20, 24, 31, 0.08)",
      highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.65)",
    },
    media: {
      cornerRadius: 18,
      frameInset: 16,
      placeholderGrid: 26,
      placeholderLabel: "Education visual placeholder",
    },
    typography: {
      display: {
        fontSize: 88,
        lineHeight: 1.02,
      },
      headline: {
        fontSize: 54,
        lineHeight: 1.08,
      },
      title: {
        fontSize: 32,
        lineHeight: 1.16,
      },
      body: {
        fontSize: 24,
        lineHeight: 1.36,
      },
      label: {
        fontSize: 18,
        lineHeight: 1.16,
      },
      caption: {
        fontSize: 18,
        lineHeight: 1.28,
      },
      mono: {
        fontSize: 18,
        lineHeight: 1.22,
      },
    },
  });
};
