import type { CodeWalkthroughFixture } from "../../../../src/styles/families/code-walkthrough";

export const debuggingTraceFixture: CodeWalkthroughFixture = {
  key: "debugging-trace", label: "Debugging trace", eyebrow: "Code walkthrough / failure isolation",
  title: "Use the failing branch to explain the debugging trace",
  summary: "A warning line pins the fault surface while the rail distinguishes observed state, active hypothesis, and verified next step.",
  density: "dense", motionPolicy: "static",
  file: { path: "src/jobs/retry.ts", language: "ts", branch: "fix/retry" },
  code: [
    { value: "const attempt = state.attempt + 1;" },
    { value: "if (attempt > policy.maxAttempts) {", tone: "warning" },
    { value: "  return markFailed(job, 'retry limit');", tone: "warning" },
    { value: "}" },
    { value: "await schedule(job, backoff(attempt));", tone: "active" },
    { value: "return markPending(job, attempt);" },
  ],
  sideLabel: "Trace state", sideTitle: "Failure happens before rescheduling", sideDetail: "Static motion makes this diagnostic frame stable for review capture.",
  steps: [
    { label: "Observed", detail: "Attempt count reaches the policy limit.", state: "blocked" },
    { label: "Hypothesis", detail: "Limit check precedes schedule as intended.", state: "active" },
    { label: "Next", detail: "Inspect policy input, not queue timing.", state: "ready" },
  ],
  caption: "The trace isolates the stop condition before the scheduler is called, narrowing the next diagnostic step.",
};
