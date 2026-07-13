import { createContext, useContext } from "react";
import type { Tone, VideoInput } from "./data";

type Theme = VideoInput["theme"];

export type SkinName = "premium-gold" | "modern-terminal";

export type SkinTone = {
  fill: string;
  stroke: string;
  glow: string;
  text: string;
};

export type Skin = {
  name: SkinName;
  palette: {
    background: string;
    backgroundGradient: string;
    surface: string;
    surfaceRaised: string;
    textPrimary: string;
    /** "r,g,b" triple of textPrimary, for rgba() derivations */
    textPrimaryRgb: string;
    textSecondary: string;
    accent: string;
    /** "r,g,b" triple of accent, for rgba() derivations */
    accentRgb: string;
    accentDeep: string;
    glow: string;
    border: string;
    font: string;
    fontMono: string;
    promptSymbol: string;
  };
  chrome: {
    /** Wrap every scene in a terminal window frame */
    terminalFrame: boolean;
    /** Titles type in with a blinking block cursor */
    typewriterTitles: boolean;
    /** Faint CRT scanline overlay */
    scanlines: boolean;
    /**
     * When true, ignore theme.foreground/muted and scene accents from the
     * video map and use the skin palette instead (keeps the skin coherent).
     */
    overrideThemeColors: boolean;
  };
  effects: {
    matrixColor: string;
    matrixGlow: string;
    starColor: string;
    starGlow: string;
    gradientSecondary: string;
    connector: {
      start: string;
      mid: string;
      end: string;
      arrow: string;
    };
  };
  toneMap: Record<Tone, SkinTone>;
  /** Standard ANSI 16-color map. Source: pipeline/processors/ansi.mjs (COLORS). */
  ansi: Record<number, string>;
};

export const withAlpha = (rgbTriple: string, alpha: number) =>
  `rgba(${rgbTriple},${alpha})`;

/** ANSI 16-color palette, copied from pipeline/processors/ansi.mjs lines 2-19. */
const ansiColors: Record<number, string> = {
  30: "#000000",
  31: "#cd3131",
  32: "#0dbc79",
  33: "#e5e510",
  34: "#2472c8",
  35: "#bc3fbc",
  36: "#11a8cd",
  37: "#e5e5e5",
  90: "#666666",
  91: "#f14c4c",
  92: "#23d18b",
  93: "#f5f543",
  94: "#3b8eea",
  95: "#d670d6",
  96: "#29b8db",
  97: "#ffffff",
};

const premiumGold: Skin = {
  name: "premium-gold",
  palette: {
    background: "#0B0C0E",
    backgroundGradient:
      "radial-gradient(circle at 50% 20%, rgba(210,180,122,0.14), transparent 25%), radial-gradient(circle at 12% 12%, rgba(244,240,232,0.05), transparent 20%), linear-gradient(160deg, #0B0C0E 0%, #111216 52%, #171717 100%)",
    surface: "#141518",
    surfaceRaised: "#1A1B1F",
    textPrimary: "#F4F0E8",
    textPrimaryRgb: "244,240,232",
    textSecondary: "#A7A39B",
    accent: "#D2B47A",
    accentRgb: "210,180,122",
    accentDeep: "#8F6C3F",
    glow: "rgba(210,180,122,0.16)",
    border: "rgba(255,255,255,0.08)",
    font: '"Be Vietnam Pro", "Manrope", "Inter", "Segoe UI", Arial, sans-serif',
    fontMono: "Consolas, monospace",
    promptSymbol: "",
  },
  chrome: {
    terminalFrame: false,
    typewriterTitles: false,
    scanlines: false,
    overrideThemeColors: false,
  },
  effects: {
    matrixColor: "rgba(255,190,116,0.84)",
    matrixGlow: "0 0 10px rgba(255,138,61,0.68)",
    starColor: "rgba(255,244,230,0.95)",
    starGlow: "0 0 10px rgba(255,154,67,0.44)",
    gradientSecondary: "rgba(255,224,184,0.20)",
    connector: {
      start: "#ff8a3d",
      mid: "#ffb347",
      end: "#fff1dd",
      arrow: "#ffcf96",
    },
  },
  toneMap: {
    warm: {
      fill: "rgba(210,180,122,0.13)",
      stroke: "rgba(210,180,122,0.56)",
      glow: "rgba(210,180,122,0.22)",
      text: "#F4F0E8",
    },
    cool: {
      fill: "rgba(120,150,180,0.11)",
      stroke: "rgba(160,185,210,0.34)",
      glow: "rgba(120,150,180,0.14)",
      text: "#edf8ff",
    },
    danger: {
      fill: "rgba(190,92,74,0.12)",
      stroke: "rgba(216,126,104,0.42)",
      glow: "rgba(216,126,104,0.16)",
      text: "#ffe8e3",
    },
    neutral: {
      fill: "rgba(255,255,255,0.055)",
      stroke: "rgba(255,255,255,0.08)",
      glow: "rgba(255,255,255,0.06)",
      text: "#F4F0E8",
    },
  },
  ansi: ansiColors,
};

const modernTerminal: Skin = {
  name: "modern-terminal",
  palette: {
    background: "#0A0E12",
    backgroundGradient:
      "radial-gradient(circle at 50% 18%, rgba(35,209,139,0.10), transparent 26%), radial-gradient(circle at 12% 12%, rgba(230,237,243,0.04), transparent 20%), linear-gradient(160deg, #0A0E12 0%, #0D1219 52%, #0A0F14 100%)",
    surface: "#10151B",
    surfaceRaised: "#151B23",
    textPrimary: "#E6EDF3",
    textPrimaryRgb: "230,237,243",
    textSecondary: "#8B949E",
    accent: "#23d18b",
    accentRgb: "35,209,139",
    accentDeep: "#0dbc79",
    glow: "rgba(35,209,139,0.16)",
    border: "rgba(35,209,139,0.15)",
    font:
      '"JetBrains Mono", "Cascadia Mono", Consolas, "Be Vietnam Pro", monospace',
    fontMono:
      '"JetBrains Mono", "Cascadia Mono", Consolas, "Be Vietnam Pro", monospace',
    promptSymbol: "❯",
  },
  chrome: {
    terminalFrame: true,
    typewriterTitles: true,
    scanlines: true,
    overrideThemeColors: true,
  },
  effects: {
    matrixColor: "rgba(35,209,139,0.84)",
    matrixGlow: "0 0 10px rgba(13,188,121,0.68)",
    starColor: "rgba(233,255,244,0.95)",
    starGlow: "0 0 10px rgba(35,209,139,0.40)",
    gradientSecondary: "rgba(35,209,139,0.10)",
    connector: {
      start: "#0dbc79",
      mid: "#23d18b",
      end: "#d9fce9",
      arrow: "#7ce8b5",
    },
  },
  toneMap: {
    warm: {
      fill: "rgba(229,229,16,0.10)",
      stroke: "rgba(229,229,16,0.50)",
      glow: "rgba(229,229,16,0.16)",
      text: "#E6EDF3",
    },
    cool: {
      fill: "rgba(36,114,200,0.12)",
      stroke: "rgba(86,182,194,0.45)",
      glow: "rgba(41,184,219,0.16)",
      text: "#dff6ff",
    },
    danger: {
      fill: "rgba(205,49,49,0.12)",
      stroke: "rgba(241,76,76,0.45)",
      glow: "rgba(241,76,76,0.16)",
      text: "#ffe1dc",
    },
    neutral: {
      fill: "rgba(230,237,243,0.05)",
      stroke: "rgba(139,148,158,0.30)",
      glow: "rgba(139,148,158,0.10)",
      text: "#E6EDF3",
    },
  },
  ansi: ansiColors,
};

export const skins: Record<SkinName, Skin> = {
  "premium-gold": premiumGold,
  "modern-terminal": modernTerminal,
};

export const resolveSkin = (theme?: Theme): Skin => {
  const name = theme?.skin;
  if (name && name in skins) {
    return skins[name];
  }
  return premiumGold;
};

export const SkinContext = createContext<Skin>(premiumGold);

export const useSkin = (): Skin => useContext(SkinContext);

/** Foreground text color: video-map theme for premium, skin palette for terminal. */
export const skinForeground = (skin: Skin, theme: Theme) =>
  skin.chrome.overrideThemeColors ? skin.palette.textPrimary : theme.foreground;

/** Muted text color: video-map theme for premium, skin palette for terminal. */
export const skinMuted = (skin: Skin, theme: Theme) =>
  skin.chrome.overrideThemeColors ? skin.palette.textSecondary : theme.muted;

/** Per-scene accent: honored for premium, forced to skin accent for terminal. */
export const skinSceneAccent = (skin: Skin, sceneAccent: string) =>
  skin.chrome.overrideThemeColors ? skin.palette.accent : sceneAccent;
