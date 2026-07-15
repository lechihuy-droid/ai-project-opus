import type { ContextChipProps } from "../../src/mechanism/ContextChip";
import type { DiffHighlightProps } from "../../src/mechanism/DiffHighlight";
import type { MechanismWindowProps } from "../../src/mechanism/MechanismWindow";
import type { TimerMorphProps } from "../../src/mechanism/TimerMorph";
import continuousSampleJson from "../fixtures/continuous-video-map.json";
import type { ContinuousVideoMap } from "../../src/data";

// The schema test verifies the JSON shape. Keeping the fixture in the TS
// program also checks that consumers can bind it to the continuous contract.
export const typedContinuousSample =
  continuousSampleJson as unknown as ContinuousVideoMap;

export const validWindowProps = {
  variant: "email",
  title: "件名",
  japaneseText: "資料をお送りします。",
  vietnameseText: "Tôi xin gửi tài liệu.",
  state: "draft",
} satisfies MechanismWindowProps;

export const validChipProps = {
  label: "Người nhận",
  value: "Khách hàng Nhật",
  target: { x: 0.5, y: 0.4 },
} satisfies ContextChipProps;

export const validTimerProps = {
  from: "30:00",
  to: "05:00",
  position: { left: 96, top: 860 },
} satisfies TimerMorphProps;

export const validDiffProps = {
  before: [{ text: "送ります", highlight: "error" }],
  after: [{ text: "お送りいたします", highlight: "correction" }],
} satisfies DiffHighlightProps;

export const invalidWindowVariant: MechanismWindowProps = {
  ...validWindowProps,
  // @ts-expect-error MechanismWindow variants are a closed renderer-owned union.
  variant: "browser",
};

export const invalidWindowStyle: MechanismWindowProps = {
  ...validWindowProps,
  // @ts-expect-error Components do not accept raw CSS passthrough.
  style: { opacity: 0 },
};

export const invalidTimer: TimerMorphProps = {
  // @ts-expect-error Timer values use the mm:ss contract.
  from: "30 minutes",
  to: "05:00",
};

export const invalidDiff: DiffHighlightProps = {
  // @ts-expect-error Highlight roles are restricted to error and correction.
  before: [{ text: "x", highlight: "warning" }],
  after: [],
};
