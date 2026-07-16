import assert from "node:assert/strict";
import test from "node:test";
import { mergeKnowledgeSelections, selectFactualKnowledge } from "../../pipeline/retrieval/select-factual-knowledge.mjs";

const normalized = {
  schemaVersion: "normalized-visual-input/v1",
  projectId: "factual-selection",
  events: [{
    id: "event-1",
    title: "GPT-5.6 availability",
    body: "The model family is available across approved product surfaces.",
    intent: "explain",
    beatRole: "evidence",
    actors: ["OpenAI"],
    factRefs: ["source:factual:openai-gpt-5-6"],
  }],
};
const result = {
  results: [{
    id: "chunk:factual:1",
    domain: "factual",
    title: "OpenAI GPT-5.6 release note",
    sourceType: "web",
    provenance: {
      sourceId: "source:factual:openai-gpt-5-6",
      sourceRef: "https://openai.com/index/gpt-5-6/",
    },
    score: { total: 100 },
    selectedReasons: [{ code: "SAFE_REFERENCE_APPROVED" }],
  }, {
    id: "chunk:other:1",
    domain: "factual",
    title: "Other source",
    sourceType: "web",
    provenance: { sourceId: "source:factual:other", sourceRef: "https://example.test" },
    score: { total: 90 },
    selectedReasons: [{ code: "SAFE_REFERENCE_APPROVED" }],
  }],
};

test("W9 factual retrieval resolves factRefs by canonical sourceId", () => {
  const factual = selectFactualKnowledge({
    normalized,
    config: { knowledge: { repository: "sqlite" } },
    repository: { query: (query) => {
      assert.equal(query.domain, "factual");
      return result;
    } },
  });
  assert.deepEqual(factual.selections[0].resolvedFactRefs, ["source:factual:openai-gpt-5-6"]);
  assert.equal(factual.selections[0].evidence[0].id, "source:factual:openai-gpt-5-6");
  assert.equal(factual.selections[0].evidence[0].chunkId, "chunk:factual:1");
  assert.equal(factual.summary.resolved, 1);
});

test("W9 merged selection preserves strict visual and factual domains", () => {
  const factual = selectFactualKnowledge({ normalized, config: { knowledge: {} }, repository: { query: () => result } });
  const visual = {
    schemaVersion: "visual-knowledge-selection/v1",
    enabled: true,
    repository: "injected",
    manifestHash: "manifest",
    summary: { queried: 1, matched: 1, evidence: 1, domain: "visual-style" },
    selections: [{
      eventId: "event-1",
      recommendedFamily: "infographic",
      query: { domain: "visual-style" },
      evidence: [{ id: "visual-1", domain: "visual-style", family: "infographic" }],
    }],
  };
  const merged = mergeKnowledgeSelections({ visual, factual });
  assert.equal(merged.schemaVersion, "lucida-knowledge-selection/v2");
  assert.deepEqual(merged.selections[0].evidence.map((item) => item.domain), ["visual-style", "factual"]);
  assert.equal(merged.selections[0].recommendedFamily, "infographic");
  assert.equal(merged.summary.domains.factual.resolved, 1);
});
