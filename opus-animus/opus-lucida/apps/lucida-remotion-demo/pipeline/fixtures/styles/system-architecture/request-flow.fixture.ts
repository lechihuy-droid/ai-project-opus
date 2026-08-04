import type { SystemArchitectureFixture } from "../../../../src/styles/families/system-architecture";

export const requestFlowFixture: SystemArchitectureFixture = {
  key: "request-flow", label: "Request flow", eyebrow: "System architecture / request boundary",
  title: "Make every request handoff explicit from entry to response",
  summary: "The flow follows one visible request so gateway policy, service work, and response shaping remain auditable.",
  density: "balanced", motionPolicy: "reduce",
  nodes: [
    { id: "caller", label: "Caller", detail: "Starts request", x: 17, y: 22, tone: "accent" },
    { id: "gateway", label: "Gateway", detail: "Auth and rate limit", x: 50, y: 22, tone: "success" },
    { id: "handler", label: "Handler", detail: "Validate command", x: 83, y: 22, tone: "accent" },
    { id: "service", label: "Service", detail: "Apply domain rule", x: 83, y: 58, tone: "warning" },
    { id: "response", label: "Response", detail: "Return result", x: 50, y: 82, tone: "success" },
  ],
  edges: [{ from: "caller", to: "gateway", label: "request" }, { from: "gateway", to: "handler" }, { from: "handler", to: "service" }, { from: "service", to: "response", label: "result" }],
  caption: "The gateway owns admission, the handler owns validation, and the service owns the domain decision.",
};
