import type { TypographyToken } from "./tokens";
import { resolveTypographyToken, type StyleCoreTokens } from "./tokens";
import type { TextDensity, TypographyRole } from "./types";

export type TextCapacityRequest = {
  text: string;
  width: number;
  height?: number;
  fontSize: number;
  lineHeight: number;
  maxLines?: number;
  density?: TextDensity;
  averageGlyphWidth?: number;
};

export type TextCapacityResult = {
  charactersPerLine: number;
  estimatedLines: number;
  estimatedHeight: number;
  maxWordsApprox: number;
  longestWord: string;
  longestWordFits: boolean;
  fitsLines: boolean;
  fitsHeight: boolean;
  fits: boolean;
  densityScore: number;
};

export type TypographyFitRequest = {
  tokens: StyleCoreTokens;
  role: TypographyRole;
  text: string;
  width: number;
  height?: number;
  maxLines?: number;
  density?: TextDensity;
  minScale?: number;
};

export type TypographyFitResult = {
  style: TypographyToken;
  scale: number;
  capacity: TextCapacityResult;
};

const normalizeText = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();

const splitWords = (text: string) => normalizeText(text).split(" ").filter(Boolean);

const densityThreshold = (density: TextDensity) => {
  if (density === "sparse") {
    return 0.74;
  }

  if (density === "dense") {
    return 1.08;
  }

  return 0.92;
};

export const estimateCharactersPerLine = ({
  width,
  fontSize,
  averageGlyphWidth = 0.56,
}: Pick<TextCapacityRequest, "width" | "fontSize" | "averageGlyphWidth">) =>
  Math.max(1, Math.floor(width / (fontSize * averageGlyphWidth)));

export const estimateTextLines = (
  text: string,
  charactersPerLine: number,
): number => {
  if (!text.trim()) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalizeText(text).length / charactersPerLine));
};

export const estimateTextBlockHeight = ({
  estimatedLines,
  fontSize,
  lineHeight,
}: Pick<TextCapacityResult, "estimatedLines"> &
  Pick<TextCapacityRequest, "fontSize" | "lineHeight">) =>
  estimatedLines * fontSize * lineHeight;

export const resolveTextCapacity = ({
  text,
  width,
  height,
  fontSize,
  lineHeight,
  maxLines,
  density = "balanced",
  averageGlyphWidth,
}: TextCapacityRequest): TextCapacityResult => {
  const words = splitWords(text);
  const charactersPerLine = estimateCharactersPerLine({
    width,
    fontSize,
    averageGlyphWidth,
  });
  const estimatedLines = estimateTextLines(text, charactersPerLine);
  const estimatedHeight = estimateTextBlockHeight({
    estimatedLines,
    fontSize,
    lineHeight,
  });
  const longestWord = words.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    "",
  );
  const longestWordFits =
    longestWord.length * fontSize * (averageGlyphWidth ?? 0.56) <= width;
  const lineLimit = maxLines ?? Number.POSITIVE_INFINITY;
  const fitsLines = estimatedLines <= lineLimit;
  const fitsHeight = height === undefined ? true : estimatedHeight <= height;
  const densityScore =
    estimatedLines / Math.max(1, lineLimit === Number.POSITIVE_INFINITY ? estimatedLines : lineLimit);
  const fits =
    fitsLines &&
    fitsHeight &&
    longestWordFits &&
    densityScore <= densityThreshold(density);

  return {
    charactersPerLine,
    estimatedLines,
    estimatedHeight,
    maxWordsApprox: Math.max(1, Math.floor(charactersPerLine / 5)),
    longestWord,
    longestWordFits,
    fitsLines,
    fitsHeight,
    fits,
    densityScore,
  };
};

const FIT_SCALES = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68] as const;

export const fitTypographyToBox = ({
  tokens,
  role,
  text,
  width,
  height,
  maxLines,
  density = "balanced",
  minScale = 0.72,
}: TypographyFitRequest): TypographyFitResult => {
  const base = resolveTypographyToken(tokens, role);
  const requestedScales = FIT_SCALES.filter((scale) => scale >= minScale);

  for (const scale of requestedScales) {
    const style = {
      ...base,
      fontSize: Math.round(base.fontSize * scale),
    };
    const capacity = resolveTextCapacity({
      text,
      width,
      height,
      maxLines,
      density,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
    });

    if (capacity.fits) {
      return { style, scale, capacity };
    }
  }

  const fallbackScale = requestedScales[requestedScales.length - 1] ?? minScale;
  const style = {
    ...base,
    fontSize: Math.round(base.fontSize * fallbackScale),
  };

  return {
    style,
    scale: fallbackScale,
    capacity: resolveTextCapacity({
      text,
      width,
      height,
      maxLines,
      density,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
    }),
  };
};
