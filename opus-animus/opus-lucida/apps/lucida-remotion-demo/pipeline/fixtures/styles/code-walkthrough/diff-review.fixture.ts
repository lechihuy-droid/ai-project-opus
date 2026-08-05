import type { CodeWalkthroughFixture } from "../../../../src/styles/families/code-walkthrough";

export const diffReviewFixture: CodeWalkthroughFixture = {
  key: "diff-review", label: "Diff review", eyebrow: "Code walkthrough / semantic diff",
  title: "Make added and removed behavior legible at a glance",
  summary: "Diff meaning comes from fixed gutters, explicit plus and minus markers, and restrained semantic backgrounds rather than color alone.",
  density: "balanced", motionPolicy: "reduce",
  file: { path: "src/cache/refresh.ts", language: "ts", branch: "review/ttl" },
  code: [
    { value: "export const refresh = async (key: string) => {" },
    { value: "  const cached = memory.get(key);", tone: "removed" },
    { value: "  if (cached) return cached;", tone: "removed" },
    { value: "  const cached = memory.getFresh(key);", tone: "added" },
    { value: "  if (cached) return cached.value;", tone: "added" },
    { value: "  return fetchAndStore(key);", tone: "active" },
    { value: "};" },
  ],
  sideLabel: "Review result", sideTitle: "Freshness moves into the cache contract", sideDetail: "Removed lines remain visible so the behavior change stays auditable.",
  steps: [
    { label: "Removed", detail: "Raw cache lookup bypassed expiry.", state: "blocked" },
    { label: "Added", detail: "Fresh lookup returns a validated value.", state: "active" },
    { label: "Outcome", detail: "Expired values reach the fetch path.", state: "ready" },
  ],
  caption: "Plus and minus markers are repeated in the gutter so the diff does not rely on color alone.",
};
