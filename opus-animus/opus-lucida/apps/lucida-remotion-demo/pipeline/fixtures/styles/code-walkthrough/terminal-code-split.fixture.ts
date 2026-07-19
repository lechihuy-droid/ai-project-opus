import type { CodeWalkthroughFixture } from "../../../../src/styles/families/code-walkthrough";

export const terminalCodeSplitFixture: CodeWalkthroughFixture = {
  key: "terminal-code-split", label: "Terminal and code", eyebrow: "Code walkthrough / command to implementation",
  title: "Pair a command trace with the code that explains its output",
  summary: "The split has fixed halves: terminal evidence on the left and compact implementation context on the right.",
  density: "dense", motionPolicy: "reduce",
  file: { path: "scripts/check-config.ts", language: "ts", branch: "main" },
  code: [
    { value: "const config = loadConfig(path);" },
    { value: "const issues = validateConfig(config);", tone: "active" },
    { value: "printIssues(issues);" },
    { value: "process.exit(issues.length ? 1 : 0);" },
  ],
  sideLabel: "Exit contract", sideTitle: "Output and process status agree", sideDetail: "The implementation panel stays compact so command evidence remains readable.",
  steps: [
    { label: "Load", detail: "Read the requested config file.", state: "ready" },
    { label: "Validate", detail: "Return deterministic issues.", state: "active" },
    { label: "Exit", detail: "Signal success or failure clearly.", state: "ready" },
  ],
  terminal: ["node scripts/check-config.ts app.json", "warn: cache.ttl is missing", "error: api.baseUrl is required", "exit 1"],
  caption: "The terminal proves the failure; the adjacent code states where its exit status is decided.",
};
