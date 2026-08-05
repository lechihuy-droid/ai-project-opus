import {
  legacyFamilyForPackageId,
  resolveProductionPackageId,
} from "./style-identifiers.mjs";

const numeric = (value) => (Number.isFinite(value) ? value : 0);
const clamp01 = (value) => Math.max(0, Math.min(1, numeric(value)));
const round4 = (value) => Math.round(numeric(value) * 10_000) / 10_000;
const formatReason = (template, intent, familyId) =>
  template.replace("{intent}", intent).replace("{familyId}", familyId);

const filterApplies = (filter, familyId) =>
  filter.families === "all" || (filter.families ?? []).includes(familyId);

const componentAvailabilityFor = (pkg) => {
  const primitives = pkg?.componentMap?.primitives ?? pkg?.componentPrimitives ?? [];
  const templates = pkg?.componentMap?.templates?.map((template) => template.templateId)
    ?? pkg?.templateBindings?.preferredTemplates ?? [];
  const available = primitives.length > 0 && templates.length > 0;
  return {
    available,
    primitives: primitives.map((primitive) => primitive.id),
    templates,
    reason: available
      ? "Package manifest exposes component primitives and template bindings."
      : "Package manifest is missing component primitives or template bindings.",
  };
};

const applyFilter = (filter, content, pkg) => {
  const failed = [];
  for (const check of filter.checks ?? []) {
    const actual = numeric(content[check.metric]);
    const capacity = numeric(pkg?.contentCapacity?.[check.capacity]);
    if (actual > capacity) failed.push(`${check.metric}=${actual} > ${check.capacity}=${capacity}`);
  }
  for (const [key, expected] of Object.entries(filter.requires ?? {})) {
    if (content[key] !== expected) failed.push(`${key}=${JSON.stringify(content[key])} expected ${JSON.stringify(expected)}`);
  }
  if (Array.isArray(filter.requiresAnyAssetClassification)) {
    const available = new Set(content.assetClassifications ?? []);
    if (!filter.requiresAnyAssetClassification.some((classification) => available.has(classification))) {
      failed.push(`assetClassifications lacks ${filter.requiresAnyAssetClassification.join(" or ")}`);
    }
  }
  if (filter.range) {
    const value = numeric(content[filter.range.metric]);
    if (value < filter.range.min || value > filter.range.max) {
      failed.push(`${filter.range.metric}=${value} outside ${filter.range.min}..${filter.range.max}`);
    }
  }
  return failed.length ? { ok: false, detail: failed.join("; ") } : { ok: true, detail: null };
};

const evidenceForCandidate = (evidence, familyId) =>
  (evidence ?? []).filter((item) => resolveProductionPackageId(item.family) === familyId);

const assertVisualStyleEvidence = (evidence) => {
  for (const item of evidence ?? []) {
    if (item?.domain !== "visual-style") {
      throw new Error(`Director rejects non-visual-style evidence: ${String(item?.id ?? "unknown")}.`);
    }
  }
};

const constraintFailure = (content, familyId) => {
  const constraints = content.visualConstraints ?? {};
  const legacyFamily = legacyFamilyForPackageId(familyId);
  if (constraints.forbiddenPackages?.includes(familyId)) return `visualConstraints forbids package ${familyId}`;
  if (constraints.forbiddenFamilies?.includes(legacyFamily)) return `visualConstraints forbids family ${legacyFamily}`;
  if (constraints.requiredPackages?.length && !constraints.requiredPackages.includes(familyId)) return "visualConstraints requires a different package";
  if (constraints.requiredFamilies?.length && !constraints.requiredFamilies.includes(legacyFamily)) return "visualConstraints requires a different family";
  return null;
};

const renderCostScore = (pkg) => ({ low: 1, medium: 0.72, high: 0.42 }[pkg?.renderCost?.tier] ?? 0.55);

const contentFitScore = (content, pkg) => {
  const pairs = [
    [content.headlineChars, pkg?.contentCapacity?.headlineChars],
    [content.bodyChars, pkg?.contentCapacity?.bodyChars],
    [content.bulletItems, pkg?.contentCapacity?.bulletsMaxItems],
    [content.codeLines, pkg?.contentCapacity?.maxCodeLines],
    [content.dataSeries, pkg?.contentCapacity?.maxDataSeries],
  ].filter(([, capacity]) => numeric(capacity) > 0);
  const utilization = pairs.length
    ? pairs.reduce((sum, [value, capacity]) => sum + clamp01(numeric(value) / numeric(capacity)), 0) / pairs.length
    : 0;
  return { value: round4(1 - utilization * 0.35), utilization: round4(utilization) };
};

const semanticScore = ({ candidate, pkg, scene, matchedEvidence, evidence }) => {
  const supported = new Set(pkg?.supportedIntents ?? []);
  const recommended = new Set(pkg?.recommendedIntents ?? []);
  const mappedOrder = candidate?.intentOrder ?? Number.POSITIVE_INFINITY;
  const mappedIntent = Number.isFinite(mappedOrder) ? Math.max(0.25, 1 - mappedOrder * 0.25) : null;
  const manifestIntent = recommended.has(scene.intent) ? 1 : supported.has(scene.intent) ? 0.85 : 0.65;
  const intent = mappedIntent ?? manifestIntent;
  const semanticText = [scene.intent, scene.content?.role, scene.content?.title, scene.content?.body, ...(scene.content?.actors ?? [])]
    .filter(Boolean).join(" ").toLowerCase().replaceAll("_", "-");
  const traits = candidate?.traits ?? [];
  const matchedTraits = traits.filter((trait) => semanticText.includes(String(trait).toLowerCase()));
  const traitFit = traits.length ? Math.max(0.35, matchedTraits.length / traits.length) : 0.5;
  const globalMax = Math.max(0, ...(evidence ?? []).map((item) => numeric(item.score)));
  const candidateMax = Math.max(0, ...matchedEvidence.map((item) => numeric(item.score)));
  const lexical = globalMax > 0 ? candidateMax / globalMax : 0;
  const approvedSignals = matchedEvidence.filter((item) =>
    (item.reasons ?? []).includes("SAFE_REFERENCE_APPROVED")
    || ((item.reasons ?? []).includes("MATCH_RIGHTS") && (item.reasons ?? []).includes("MATCH_APPROVAL")),
  ).length;
  const sourceTypes = new Set(matchedEvidence.map((item) => item.sourceType).filter(Boolean)).size;
  const evidenceQuality = matchedEvidence.length
    ? clamp01((approvedSignals / matchedEvidence.length) * 0.7 + Math.min(sourceTypes, 3) / 3 * 0.3)
    : 0;
  return {
    value: round4(intent * 0.45 + traitFit * 0.2 + lexical * 0.2 + evidenceQuality * 0.15),
    intent: round4(intent),
    traitFit: round4(traitFit),
    matchedTraits,
    lexical: round4(lexical),
    evidenceQuality: round4(evidenceQuality),
  };
};

const continuityScore = (rules, previousFamily, familyId) => {
  if (!previousFamily) return { state: "initial", value: 0.8, bridgePenalty: 0 };
  const state = rules.continuityRules?.compatibilityMatrix?.[previousFamily]?.[familyId] ?? "bridge";
  return {
    state,
    value: { native: 1, compatible: 0.9, bridge: 0.65, avoid: 0.15, block: 0 }[state] ?? 0.5,
    bridgePenalty: { native: 0, compatible: 0, bridge: 0.5, avoid: 1, block: 1 }[state] ?? 0.5,
  };
};

const scoreCandidate = ({ rules, packages, candidateDefinition, candidate, scene, evidence, history }) => {
  const pkg = packages[candidate.familyId];
  const matchedEvidence = evidenceForCandidate(evidence, candidate.familyId);
  const intentOrder = (rules.intentToFamily?.[scene.intent] ?? []).indexOf(candidate.familyId);
  const semanticFit = semanticScore({
    candidate: { ...candidateDefinition, intentOrder: intentOrder < 0 ? Number.POSITIVE_INFINITY : intentOrder },
    pkg,
    scene,
    matchedEvidence,
    evidence,
  });
  const contentFit = candidate.status === "accepted" ? contentFitScore(scene.content ?? {}, pkg) : { value: 0, utilization: 1 };
  const previousFamily = history.selectedFamilies.at(-1) ?? null;
  const continuity = continuityScore(rules, previousFamily, candidate.familyId);
  const assetAvailability = candidate.componentAvailability.available ? 1 : 0;
  const renderingCost = renderCostScore(pkg);
  const occurrences = history.selectedFamilies.filter((familyId) => familyId === candidate.familyId).length;
  const consecutive = previousFamily === candidate.familyId ? 1 : 0;
  const repetitionPenalty = round4(consecutive * 0.06 + Math.min(occurrences, 4) * 0.01);
  const weights = rules.scoring;
  const total = candidate.status === "accepted"
    ? round4(
        semanticFit.value * weights.semanticFit
        + contentFit.value * weights.contentFit
        + continuity.value * weights.continuity
        + assetAvailability * weights.assetAvailability
        + renderingCost * weights.renderingCost
        - continuity.bridgePenalty * weights.bridgePenalty
        - repetitionPenalty,
      )
    : 0;
  return {
    familyId: candidate.familyId,
    status: candidate.status,
    total,
    components: {
      semanticFit,
      contentFit,
      continuity: { state: continuity.state, value: round4(continuity.value) },
      assetAvailability,
      renderingCost: round4(renderingCost),
      bridgePenalty: round4(continuity.bridgePenalty),
    },
    repetitionPenalty,
  };
};

const rankCandidates = ({ rules, packages, candidatesById, candidates, scene, evidence, history }) => {
  const originalOrder = new Map(candidates.map((candidate, index) => [candidate.familyId, index]));
  const scores = candidates.map((candidate) => scoreCandidate({
    rules,
    packages,
    candidateDefinition: candidatesById.get(candidate.familyId),
    candidate,
    scene,
    evidence,
    history,
  }));
  const byFamily = new Map(scores.map((score) => [score.familyId, score]));
  candidates.sort((left, right) =>
    byFamily.get(right.familyId).total - byFamily.get(left.familyId).total
    || originalOrder.get(left.familyId) - originalOrder.get(right.familyId)
    || left.familyId.localeCompare(right.familyId),
  );
  return candidates.map((candidate, rank) => ({ ...byFamily.get(candidate.familyId), rank }));
};

const selectLayout = ({ rules, familyId, intent, history, content }) => {
  const implemented = new Set(["top-title", "center-stage", "oversized-type", "bottom-statement", "full-bleed-visual"]);
  let layouts = (rules.layoutRules?.familyPreferences?.[familyId] ?? [rules.layoutRules?.effectiveDefault ?? "top-title"])
    .filter((layout) => implemented.has(layout));
  const constraints = content?.visualConstraints?.layout ?? {};
  if (constraints.required?.length) {
    const required = constraints.required.filter((layout) => implemented.has(layout));
    if (required.length) layouts = required;
  }
  if (constraints.forbidden?.length) layouts = layouts.filter((layout) => !constraints.forbidden.includes(layout));
  if (["hook", "takeaway"].includes(intent)) layouts = layouts.filter((layout) => layout !== "top-title");
  if (!layouts.length) layouts = [intent === "hook" || intent === "takeaway" ? "center-stage" : "top-title"];
  const counts = new Map();
  history.selectedLayouts.forEach((layout) => counts.set(layout, (counts.get(layout) ?? 0) + 1));
  const previous = history.selectedLayouts.at(-1) ?? null;
  const selectedLayout = [...layouts].sort((left, right) =>
    Number(left === previous) - Number(right === previous)
    || (counts.get(left) ?? 0) - (counts.get(right) ?? 0)
    || layouts.indexOf(left) - layouts.indexOf(right),
  )[0];
  return { selectedLayout, layoutCandidates: layouts };
};

const traceAuditFields = ({ scores, selected, approvalRef, layout }) => ({
  scores,
  repetitionPenalty: {
    applied: numeric(scores.find((score) => score.familyId === selected?.familyId)?.repetitionPenalty) > 0,
    value: scores.find((score) => score.familyId === selected?.familyId)?.repetitionPenalty ?? 0,
    reason: selected
      ? "Penalty reflects prior family use and immediate repetition in this run."
      : "No package was selected.",
  },
  selectedLayout: layout?.selectedLayout ?? null,
  layoutCandidates: layout?.layoutCandidates ?? [],
  approvalRef: approvalRef ?? null,
});

const evaluateAutoCandidate = ({ rules, candidatesById, packages, familyId, scene, evidence }) => {
  const candidate = candidatesById.get(familyId);
  const pkg = packages[familyId];
  const componentAvailability = componentAvailabilityFor(pkg);
  const matchedEvidence = evidenceForCandidate(evidence, familyId);
  const selectedReasons = [
    formatReason(rules.intentReasonTemplate.selected, scene.intent, familyId),
    candidate?.selectedReason,
    pkg?.directorCompatibility?.selectionReason,
    componentAvailability.reason,
    matchedEvidence.length
      ? `Approved RAG evidence supports this package: ${matchedEvidence.map((item) => item.id).join(", ")}.`
      : "No package-matched RAG evidence is available; RAG did not select this package.",
  ].filter(Boolean);
  const rejectedReasons = [];
  if (!candidate || !pkg) {
    rejectedReasons.push({ filterId: "package-manifest", reason: "Candidate is missing its production package manifest.", detail: familyId });
  }
  if (!componentAvailability.available) {
    rejectedReasons.push({ filterId: "component-availability", reason: componentAvailability.reason, detail: familyId });
  }
  const constrained = constraintFailure(scene.content ?? {}, familyId);
  if (constrained) rejectedReasons.push({ filterId: "visual-constraints", reason: constrained, detail: familyId });
  for (const filter of rules.contentFitFilters ?? []) {
    if (!filterApplies(filter, familyId)) continue;
    const result = applyFilter(filter, scene.content ?? {}, pkg);
    if (result.ok) selectedReasons.push(`[${filter.id}] ${filter.selectedReason}`);
    else rejectedReasons.push({ filterId: filter.id, reason: filter.rejectedReason, detail: result.detail });
  }
  return {
    familyId,
    legacyFamily: legacyFamilyForPackageId(familyId),
    status: rejectedReasons.length ? "rejected" : "accepted",
    selectedReasons,
    rejectedReasons,
    evidenceIds: matchedEvidence.map((item) => item.id),
    componentAvailability,
    fallback: false,
  };
};

const lockedCandidate = ({ packages, lockedStyle, evidence }) => {
  const familyId = resolveProductionPackageId(lockedStyle?.family);
  const pkg = familyId ? packages[familyId] : null;
  const componentAvailability = componentAvailabilityFor(pkg);
  const matchedEvidence = familyId ? evidenceForCandidate(evidence, familyId) : [];
  const rejectedReasons = [];
  if (!familyId || !pkg) {
    rejectedReasons.push({ filterId: "locked-style", reason: "Locked style does not resolve to a production package.", detail: String(lockedStyle?.family ?? "") });
  }
  if (!componentAvailability.available) {
    rejectedReasons.push({ filterId: "component-availability", reason: componentAvailability.reason, detail: familyId ?? "" });
  }
  return {
    familyId,
    legacyFamily: legacyFamilyForPackageId(familyId),
    status: rejectedReasons.length ? "rejected" : "accepted",
    selectedReasons: rejectedReasons.length
      ? []
      : [
          `Locked to package-backed family ${familyId}.`,
          `Locked by ${lockedStyle.lockedBy}: ${lockedStyle.reason}`,
          componentAvailability.reason,
          matchedEvidence.length
            ? `RAG evidence is recorded as supporting context only: ${matchedEvidence.map((item) => item.id).join(", ")}.`
            : "No RAG evidence selected this package; it was explicitly locked.",
        ],
    rejectedReasons,
    evidenceIds: matchedEvidence.map((item) => item.id),
    componentAvailability,
    fallback: false,
  };
};

export const evaluateDirectorSelection = ({
  director,
  mode,
  scene,
  lockedStyle,
  evidence = [],
  approvalRef = null,
  history = {},
}) => {
  assertVisualStyleEvidence(evidence);
  const { rules, packages } = director;
  const selectionHistory = {
    selectedFamilies: Array.isArray(history.selectedFamilies) ? history.selectedFamilies : [],
    selectedLayouts: Array.isArray(history.selectedLayouts) ? history.selectedLayouts : [],
  };
  const candidatesById = new Map((rules.productionCandidates ?? []).map((candidate) => [candidate.id, candidate]));
  if (mode === "locked") {
    const candidate = lockedCandidate({ packages, lockedStyle, evidence });
    const constrained = candidate.familyId ? constraintFailure(scene.content ?? {}, candidate.familyId) : null;
    if (constrained) {
      candidate.status = "rejected";
      candidate.selectedReasons = [];
      candidate.rejectedReasons.push({ filterId: "visual-constraints", reason: constrained, detail: candidate.familyId ?? "" });
    }
    const scores = rankCandidates({ rules, packages, candidatesById, candidates: [candidate], scene, evidence, history: selectionHistory });
    const selected = candidate.status === "accepted" ? candidate : null;
    const layout = selected ? selectLayout({ rules, familyId: selected.familyId, intent: scene.intent, history: selectionHistory, content: scene.content }) : null;
    return {
      schemaVersion: "director-selection/v1",
      mode,
      intent: scene.intent,
      queryIntent: scene.intent,
      candidates: [candidate],
      ...traceAuditFields({ scores, selected, approvalRef, layout }),
      selected,
      fallback: { used: false, familyId: null, reason: null },
      lockedBy: lockedStyle?.lockedBy ?? null,
      reason: lockedStyle?.reason ?? null,
    };
  }

  const familyIds = rules.intentToFamily?.[scene.intent] ?? [];
  const candidates = familyIds.map((familyId) =>
    evaluateAutoCandidate({ rules, candidatesById, packages, familyId, scene, evidence }),
  );
  const scores = rankCandidates({ rules, packages, candidatesById, candidates, scene, evidence, history: selectionHistory });
  const selected = candidates.find((candidate) => candidate.status === "accepted") ?? null;
  if (selected) {
    const layout = selectLayout({ rules, familyId: selected.familyId, intent: scene.intent, history: selectionHistory, content: scene.content });
    return {
      schemaVersion: "director-selection/v1",
      mode,
      intent: scene.intent,
      queryIntent: scene.intent,
      candidates,
      ...traceAuditFields({ scores, selected, approvalRef, layout }),
      selected,
      fallback: { used: false, familyId: null, reason: null },
      lockedBy: null,
      reason: null,
    };
  }

  const fallbackOrder = [
    "technical-editorial",
    ...(rules.productionStyleIds ?? []).filter((id) => id !== "technical-editorial"),
  ];
  const fallbackId = fallbackOrder.find((familyId) => componentAvailabilityFor(packages[familyId]).available) ?? null;
  const fallback = fallbackId
    ? {
        familyId: fallbackId,
        legacyFamily: legacyFamilyForPackageId(fallbackId),
        status: "accepted",
        selectedReasons: [`No intent candidate passed; deterministic ${fallbackId} fallback was selected.`],
        rejectedReasons: [],
        evidenceIds: evidenceForCandidate(evidence, fallbackId).map((item) => item.id),
        componentAvailability: componentAvailabilityFor(packages[fallbackId]),
        fallback: true,
      }
    : null;
  if (fallback) candidates.push(fallback);
  const fallbackScores = rankCandidates({ rules, packages, candidatesById, candidates, scene, evidence, history: selectionHistory });
  const layout = fallback ? selectLayout({ rules, familyId: fallback.familyId, intent: scene.intent, history: selectionHistory, content: scene.content }) : null;
  return {
    schemaVersion: "director-selection/v1",
    mode,
    intent: scene.intent,
    queryIntent: scene.intent,
    candidates,
    ...traceAuditFields({ scores: fallbackScores, selected: fallback, approvalRef, layout }),
    selected: fallback,
    fallback: {
      used: Boolean(fallback),
      familyId: fallbackId,
      reason: "No intent candidate passed package content/component checks.",
    },
    lockedBy: null,
    reason: null,
  };
};

export const evaluateContinuity = ({ rules, selectedFamilies, intents }) => {
  const continuity = rules.continuityRules;
  const counts = new Map();
  const firstSeen = new Map();
  selectedFamilies.forEach((familyId, index) => {
    counts.set(familyId, (counts.get(familyId) ?? 0) + 1);
    if (!firstSeen.has(familyId)) firstSeen.set(familyId, index);
  });
  const [dominantFamily, dominantCount] = [...counts.entries()].sort((left, right) =>
    right[1] - left[1] || firstSeen.get(left[0]) - firstSeen.get(right[0]),
  )[0] ?? [null, 0];
  const errors = [];
  const dominantShare = selectedFamilies.length ? dominantCount / selectedFamilies.length : 0;
  if (dominantShare < continuity.dominantFamilyMinimumShare) errors.push("dominantFamilyMinimumShare");
  if (counts.size > continuity.maxVisualFamiliesForShort) errors.push("maxVisualFamiliesForShort");
  if (continuity.returnToDominantFamilyForOutro && continuity.outroIntents.includes(intents.at(-1)) && selectedFamilies.at(-1) !== dominantFamily) {
    errors.push("returnToDominantFamilyForOutro");
  }
  for (let index = 1; index < selectedFamilies.length; index += 1) {
    const state = continuity.compatibilityMatrix?.[selectedFamilies[index - 1]]?.[selectedFamilies[index]];
    if (state === "avoid" || state === "block") errors.push("compatibilityMatrix");
  }
  return { valid: !errors.length, dominantFamily, dominantShare, errors: [...new Set(errors)] };
};
