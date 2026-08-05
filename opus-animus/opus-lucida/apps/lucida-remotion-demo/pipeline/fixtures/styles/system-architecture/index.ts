import agentGraphFixture from "./agent-graph.fixture.json";
import dataPipelineFixture from "./data-pipeline.fixture.json";
import dependencyMapFixture from "./dependency-map.fixture.json";
import layeredStackFixture from "./layered-stack.fixture.json";
import requestFlowFixture from "./request-flow.fixture.json";
import type { SystemArchitectureFixture } from "../../../../src/styles/families/system-architecture";

export const systemArchitectureFixtures = {
  "layered-stack": layeredStackFixture as SystemArchitectureFixture,
  "request-flow": requestFlowFixture as SystemArchitectureFixture,
  "agent-graph": agentGraphFixture as SystemArchitectureFixture,
  "data-pipeline": dataPipelineFixture as SystemArchitectureFixture,
  "dependency-map": dependencyMapFixture as SystemArchitectureFixture,
};

export type { SystemArchitectureFixture, SystemArchitectureVariantId } from "../../../../src/styles/families/system-architecture";
