import { createStyleCoreTokens } from "../../core";

export const newsRundownTokens = createStyleCoreTokens({
  meta: { familyId: "news-rundown", version: "0.1.0" },
  color: { canvas: "#101820", canvasRaised: "#17232D", surface: "#17232D", surfaceElevated: "#20313D", surfaceOverlay: "rgba(16, 24, 32, 0.96)", textStrong: "#F7F4EC", textMuted: "#B7C3CC", textSoft: "#8295A3", accent: "#4AB7D8", accentSoft: "rgba(74, 183, 216, 0.14)", success: "#73C596", warning: "#F2B64C", danger: "#F0645A", rule: "rgba(247, 244, 236, 0.16)", shadow: "rgba(0, 0, 0, 0.34)", placeholder: "#536571" },
  spacing: { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, gutter: 20, safeMargin: 72 },
  radius: { sm: 4, md: 6, lg: 8, xl: 8, pill: 999 },
  grid: { columns: 12, gutter: 20, rowGap: 20, outerMargin: 72, maxContentWidth: 936 },
  motion: { policy: "full", fastFrames: 8, normalFrames: 16, slowFrames: 22, distanceSm: 8, distanceMd: 14, distanceLg: 20 },
  surface: { borderWidth: 1, shadowBase: "0 16px 36px rgba(0, 0, 0, 0.18)", shadowRaised: "0 22px 48px rgba(0, 0, 0, 0.22)", shadowOverlay: "0 28px 56px rgba(0, 0, 0, 0.28)", highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.05)" },
  media: { cornerRadius: 8, frameInset: 16, placeholderGrid: 24, placeholderLabel: "Draft package" },
  typography: {
    display: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 76, lineHeight: 1.01, fontWeight: 850, letterSpacing: 0 },
    headline: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 48, lineHeight: 1.08, fontWeight: 800, letterSpacing: 0 },
    title: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 28, lineHeight: 1.16, fontWeight: 740, letterSpacing: 0 },
    body: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 20, lineHeight: 1.3, fontWeight: 540, letterSpacing: 0 },
    label: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 16, lineHeight: 1.16, fontWeight: 760, letterSpacing: 0, textTransform: "uppercase" },
    caption: { fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: 17, lineHeight: 1.25, fontWeight: 590, letterSpacing: 0 },
    mono: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 18, lineHeight: 1.4, fontWeight: 590, letterSpacing: 0 },
  },
});
