export const graphite = "#171918";
export const ivory = "#F4EEDF";
export const champagneGold = "#D2B47A";
export const vermilion = "#D84A3A";

export const MIN_FONT_SIZE = 32;

export const FONT_SIZE_WHITELIST = Object.freeze({
  diffAnnotation: {
    fontSize: 26,
    reason: "Short, adjacent diff callout; never used for primary content.",
  },
});

export const mechanismTokens = Object.freeze({
  color: {
    graphite,
    graphiteSoft: "#282B29",
    ivory,
    ivoryMuted: "#DED5C1",
    champagneGold,
    vermilion,
    white: "#FFFDF7",
  },
  typography: {
    minimum: MIN_FONT_SIZE,
    body: 38,
    label: 32,
    title: 40,
    timer: 142,
  },
  radius: {
    window: 34,
    panel: 22,
    pill: 999,
  },
  motion: {
    fast: 12,
    normal: 24,
    slow: 42,
  },
});
