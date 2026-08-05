import { createStyleCoreTokens } from "../../core";

export const terminalCommandCenterTokens = createStyleCoreTokens({
  meta: { familyId: "terminal-command-center", version: "0.1.0" },
  color: {
    canvas: "#080B10", canvasRaised: "#10151D", surface: "#10151D",
    surfaceElevated: "#151B24", surfaceOverlay: "rgba(8, 11, 16, 0.96)",
    textStrong: "#F4F0E8", textMuted: "#AAB5C2", textSoft: "#7D8A98",
    accent: "#65D8E8", accentSoft: "rgba(101, 216, 232, 0.14)",
    success: "#72C991", warning: "#D2B47A", danger: "#EC7A7A",
    rule: "rgba(244, 240, 232, 0.14)", shadow: "rgba(0, 0, 0, 0.44)", placeholder: "#4D5966",
  },
  spacing: { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, gutter: 20, safeMargin: 72 },
  radius: { sm: 4, md: 6, lg: 8, xl: 8, pill: 999 },
  grid: { columns: 12, gutter: 20, rowGap: 20, outerMargin: 72, maxContentWidth: 936 },
  motion: { policy: "full", fastFrames: 8, normalFrames: 16, slowFrames: 22, distanceSm: 8, distanceMd: 14, distanceLg: 20 },
  surface: { borderWidth: 1, shadowBase: "0 16px 36px rgba(0, 0, 0, 0.28)", shadowRaised: "0 22px 48px rgba(0, 0, 0, 0.38)", shadowOverlay: "0 28px 56px rgba(0, 0, 0, 0.46)", highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.05)" },
  media: { cornerRadius: 8, frameInset: 16, placeholderGrid: 24, placeholderLabel: "Draft package" },
  typography: {
    display: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 70, lineHeight: 1.04, fontWeight: 820, letterSpacing: 0 },
    headline: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 42, lineHeight: 1.1, fontWeight: 760, letterSpacing: 0 },
    title: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 27, lineHeight: 1.16, fontWeight: 730, letterSpacing: 0 },
    body: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 19, lineHeight: 1.3, fontWeight: 560, letterSpacing: 0 },
    label: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 15, lineHeight: 1.16, fontWeight: 760, letterSpacing: 0, textTransform: "uppercase" },
    caption: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 16, lineHeight: 1.25, fontWeight: 570, letterSpacing: 0 },
    mono: { fontFamily: 'Cascadia Mono, Consolas, "Courier New", monospace', fontSize: 18, lineHeight: 1.45, fontWeight: 570, letterSpacing: 0 },
  },
});
