import { createStyleCoreTokens } from "../../core";

export const systemArchitectureTokens = createStyleCoreTokens({
  meta: { familyId: "system-architecture", version: "0.1.0" },
  color: {
    canvas: "#11161D", canvasRaised: "#18212B", surface: "#18212B",
    surfaceElevated: "#202C38", surfaceOverlay: "rgba(17, 22, 29, 0.96)",
    textStrong: "#EFF6FB", textMuted: "#B4C3CF", textSoft: "#8395A3",
    accent: "#62C8F3", accentSoft: "rgba(98, 200, 243, 0.14)",
    success: "#75D6A0", warning: "#F2C36B", danger: "#F08080",
    rule: "rgba(239, 246, 251, 0.14)", shadow: "rgba(0, 0, 0, 0.34)", placeholder: "#56616D",
  },
  spacing: { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, gutter: 20, safeMargin: 72 },
  radius: { sm: 4, md: 6, lg: 8, xl: 8, pill: 999 },
  grid: { columns: 12, gutter: 20, rowGap: 20, outerMargin: 72, maxContentWidth: 936 },
  motion: { policy: "full", fastFrames: 8, normalFrames: 16, slowFrames: 22, distanceSm: 8, distanceMd: 14, distanceLg: 20 },
  surface: { borderWidth: 1, shadowBase: "0 16px 36px rgba(0, 0, 0, 0.18)", shadowRaised: "0 22px 48px rgba(0, 0, 0, 0.22)", shadowOverlay: "0 28px 56px rgba(0, 0, 0, 0.28)", highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.05)" },
  media: { cornerRadius: 8, frameInset: 16, placeholderGrid: 24, placeholderLabel: "Draft package" },
  typography: {
    display: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 74, lineHeight: 1.04, fontWeight: 850, letterSpacing: 0 },
    headline: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 46, lineHeight: 1.1, fontWeight: 790, letterSpacing: 0 },
    title: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 28, lineHeight: 1.16, fontWeight: 740, letterSpacing: 0 },
    body: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 20, lineHeight: 1.3, fontWeight: 540, letterSpacing: 0 },
    label: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 16, lineHeight: 1.16, fontWeight: 760, letterSpacing: 0, textTransform: "uppercase" },
    caption: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 17, lineHeight: 1.25, fontWeight: 590, letterSpacing: 0 },
    mono: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 18, lineHeight: 1.46, fontWeight: 590, letterSpacing: 0 },
  },
});
