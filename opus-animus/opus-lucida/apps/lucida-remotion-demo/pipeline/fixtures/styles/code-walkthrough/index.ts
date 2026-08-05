import { apiSequenceFixture } from "./api-sequence.fixture";
import { codeFocusFixture } from "./code-focus.fixture";
import { debuggingTraceFixture } from "./debugging-trace.fixture";
import { diffReviewFixture } from "./diff-review.fixture";
import { terminalCodeSplitFixture } from "./terminal-code-split.fixture";

export const codeWalkthroughFixtures = {
  "code-focus": codeFocusFixture,
  "diff-review": diffReviewFixture,
  "api-sequence": apiSequenceFixture,
  "debugging-trace": debuggingTraceFixture,
  "terminal-code-split": terminalCodeSplitFixture,
};

export type { CodeWalkthroughFixture, CodeWalkthroughVariantId } from "../../../../src/styles/families/code-walkthrough";
