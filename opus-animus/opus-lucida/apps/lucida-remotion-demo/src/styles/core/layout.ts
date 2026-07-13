import type { Box, Insets, VerticalPlatformId } from "./types";

export const VERTICAL_CANVAS = Object.freeze({
  width: 1080,
  height: 1920,
});

export type SafeAreaFrame = Box & {
  platform: VerticalPlatformId;
  insets: Insets;
};

export type VerticalLayoutFrame = {
  canvas: Box;
  safe: SafeAreaFrame;
  content: Box;
  caption: Box;
  mediaBleed: Box;
};

export type VerticalLayoutRequest = {
  platform?: VerticalPlatformId;
  safeArea?: Partial<Insets>;
  contentInset?: number | Partial<Insets>;
  captionInset?: number | Partial<Insets>;
  reservedHeader?: number;
  reservedFooter?: number;
  maxContentWidth?: number;
};

const PLATFORM_SAFE_AREAS: Record<VerticalPlatformId, Insets> = {
  generic: { top: 160, right: 72, bottom: 220, left: 72 },
  tiktok: { top: 186, right: 72, bottom: 260, left: 72 },
  reels: { top: 168, right: 72, bottom: 236, left: 72 },
  "youtube-shorts": { top: 152, right: 72, bottom: 214, left: 72 },
};

const normalizeInsets = (
  value: number | Partial<Insets> | undefined,
): Insets => {
  if (typeof value === "number") {
    return { top: value, right: value, bottom: value, left: value };
  }

  return {
    top: value?.top ?? 0,
    right: value?.right ?? 0,
    bottom: value?.bottom ?? 0,
    left: value?.left ?? 0,
  };
};

const clampDimension = (value: number) => Math.max(0, Math.round(value));

export const makeBox = (
  x: number,
  y: number,
  width: number,
  height: number,
): Box => ({
  x: clampDimension(x),
  y: clampDimension(y),
  width: clampDimension(width),
  height: clampDimension(height),
});

export const insetBox = (box: Box, inset: number | Partial<Insets>): Box => {
  const normalized = normalizeInsets(inset);
  return makeBox(
    box.x + normalized.left,
    box.y + normalized.top,
    box.width - normalized.left - normalized.right,
    box.height - normalized.top - normalized.bottom,
  );
};

export const resolveVerticalSafeArea = (
  platform: VerticalPlatformId = "generic",
  overrides: Partial<Insets> = {},
): SafeAreaFrame => {
  const insets = { ...PLATFORM_SAFE_AREAS[platform], ...overrides };
  const width = VERTICAL_CANVAS.width - insets.left - insets.right;
  const height = VERTICAL_CANVAS.height - insets.top - insets.bottom;

  return {
    platform,
    insets,
    ...makeBox(insets.left, insets.top, width, height),
  };
};

export const resolveVerticalLayout = ({
  platform = "generic",
  safeArea,
  contentInset = 0,
  captionInset = 0,
  reservedHeader = 0,
  reservedFooter = 0,
  maxContentWidth = 936,
}: VerticalLayoutRequest = {}): VerticalLayoutFrame => {
  const canvas = makeBox(0, 0, VERTICAL_CANVAS.width, VERTICAL_CANVAS.height);
  const safe = resolveVerticalSafeArea(platform, safeArea);
  const contentWithinSafe = insetBox(safe, {
    top: reservedHeader,
    bottom: reservedFooter,
  });
  const contentInsetBox = insetBox(contentWithinSafe, contentInset);
  const centeredContentWidth = Math.min(contentInsetBox.width, maxContentWidth);
  const content = makeBox(
    contentInsetBox.x + (contentInsetBox.width - centeredContentWidth) / 2,
    contentInsetBox.y,
    centeredContentWidth,
    contentInsetBox.height,
  );
  const captionAdjust = normalizeInsets(captionInset);
  const caption = insetBox(
    makeBox(safe.x, safe.y, safe.width, safe.height),
    {
      top: Math.max(content.height - 320, 0) + captionAdjust.top,
      right: captionAdjust.right,
      bottom: captionAdjust.bottom,
      left: captionAdjust.left,
    },
  );
  const mediaBleed = makeBox(
    Math.max(0, safe.x - 24),
    Math.max(0, safe.y - 24),
    Math.min(VERTICAL_CANVAS.width, safe.width + 48),
    Math.min(VERTICAL_CANVAS.height, safe.height + 48),
  );

  return {
    canvas,
    safe,
    content,
    caption,
    mediaBleed,
  };
};

export const resolveColumns = (
  frame: Box,
  columns: number,
  gutter: number,
): Box[] => {
  const totalGutter = gutter * Math.max(0, columns - 1);
  const columnWidth = (frame.width - totalGutter) / columns;

  return Array.from({ length: columns }, (_, index) =>
    makeBox(
      frame.x + index * (columnWidth + gutter),
      frame.y,
      columnWidth,
      frame.height,
    ),
  );
};

export const spanColumns = (
  columns: Box[],
  start: number,
  span: number,
): Box => {
  const first = columns[Math.max(0, start)];
  const last = columns[Math.min(columns.length - 1, start + span - 1)];

  return makeBox(
    first?.x ?? 0,
    first?.y ?? 0,
    (last?.x ?? first?.x ?? 0) + (last?.width ?? first?.width ?? 0) - (first?.x ?? 0),
    first?.height ?? 0,
  );
};
