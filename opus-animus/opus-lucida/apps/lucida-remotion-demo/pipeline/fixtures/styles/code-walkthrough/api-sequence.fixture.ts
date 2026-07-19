import type { CodeWalkthroughFixture } from "../../../../src/styles/families/code-walkthrough";

export const apiSequenceFixture: CodeWalkthroughFixture = {
  key: "api-sequence", label: "API sequence", eyebrow: "Code walkthrough / request lifecycle",
  title: "Trace one request through validation, dispatch, and response shaping",
  summary: "The source panel names the call boundary while the rail preserves sequence states in a fixed vertical order.",
  density: "dense", motionPolicy: "reduce",
  file: { path: "src/api/handler.ts", language: "ts", branch: "main" },
  code: [
    { value: "export async function handler(request: Request) {" },
    { value: "  const payload = await parseJson(request);" },
    { value: "  const command = validate(payload);", tone: "active" },
    { value: "  const result = await dispatch(command);" },
    { value: "  return json(serialize(result));" },
    { value: "}" },
  ],
  sideLabel: "Sequence", sideTitle: "A single request, three inspectable boundaries", sideDetail: "Each item matches the order a reviewer follows while stepping through the handler.",
  steps: [
    { label: "Parse", detail: "Request body becomes a typed payload.", state: "ready" },
    { label: "Validate", detail: "Reject invalid command shapes early.", state: "active" },
    { label: "Dispatch", detail: "Run the command and serialize output.", state: "ready" },
  ],
  caption: "The sequence stays explicit: parse, validate, dispatch, then return a serializable response.",
};
