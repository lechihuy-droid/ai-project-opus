import { evaluateDirectorSelection } from "../director/evaluate-candidates.mjs";
import { loadProductionDirector } from "../director/load-production-director.mjs";
import { assertNormalizedContentBriefBinding, assertValidContentBrief } from "../contracts/content-brief-contracts.mjs";

const clean = (text) => (text ?? "").replace(/\s+/g, " ").trim();
const titleFor = (event, fallback) => event?.title ?? (clean(event?.text?.split(/\r?\n/, 1)[0]) || fallback);

const makeBlock = (event, at = 0) => ({
  kind:
    event.kind === "narrative"
      ? "text"
      : event.kind === "layout_reference" || event.kind === "motion_reference"
        ? event.data?.url || event.data?.path
          ? "media"
          : "text"
        : event.kind === "design_token"
          ? "metric"
          : ["output", "marker", "resize"].includes(event.kind)
            ? event.kind === "marker"
              ? "text"
              : event.kind === "resize"
                ? "metric"
                : "output"
            : event.kind,
  at,
  text: event.body ?? (clean(event.text) || undefined),
  data: event.data,
  sourceEventIds: [event.id],
  ...(event.beatId ? { beatId: event.beatId } : {}),
});

const selectionFor = (event, knowledgeSelection) =>
  knowledgeSelection?.selections?.find((selection) => selection.eventId === event.id);

const evidenceFor = (events, knowledgeSelection) => [
  ...new Set(events.flatMap((event) =>
    selectionFor(event, knowledgeSelection)?.evidence?.map((item) => item.id) ?? [])),
];

const directorEvidenceFor = (events, knowledgeSelection) =>
  events.flatMap((event) => selectionFor(event, knowledgeSelection)?.evidence ?? [])
    .filter((evidence) => evidence.domain === "visual-style");

const assertFactRefsUseFactualEvidence = (events, knowledgeSelection) => {
  const evidenceById = new Map((knowledgeSelection?.selections ?? [])
    .flatMap((selection) => selection.evidence ?? [])
    .map((evidence) => [evidence.id, evidence]));
  for (const factRef of events.flatMap((event) => event.factRefs ?? [])) {
    const evidence = evidenceById.get(factRef);
    if (!evidence) {
      throw new Error(`factRefs require matching factual evidence: ${factRef}.`);
    }
    if (evidence.domain !== "factual") {
      throw new Error(`factRefs cannot use non-factual evidence: ${factRef}.`);
    }
  }
};

const legacyFamilyFor = (event, config, knowledgeSelection) => {
  const requested = event.data?.family ?? event.data?.visualFamily;
  if (config.mapping.allowedFamilies.includes(requested)) return requested;
  const recommended = selectionFor(event, knowledgeSelection)?.recommendedFamily;
  if (config.mapping.allowedFamilies.includes(recommended)) return recommended;
  if (event.kind === "narrative" && config.mapping.allowedFamilies.includes("editorial")) return "editorial";
  if (event.kind === "code" && config.mapping.allowedFamilies.includes("code")) return "code";
  if (event.kind === "design_token" && config.mapping.allowedFamilies.includes("dashboard")) return "dashboard";
  if (event.kind === "layout_reference" && config.mapping.allowedFamilies.includes("editorial")) return "editorial";
  return config.mapping.defaultFamily;
};

const intentFor = (event) => {
  if (typeof event.intent === "string" && event.intent.trim()) return event.intent;
  if (typeof event.data?.intent === "string" && event.data.intent.trim()) return event.data.intent.trim();
  return {
    narrative: "explain",
    code: "code-explanation",
    command: "process",
    output: "process",
    log: "process",
    tree: "system-architecture",
    metric: "summarize",
    design_token: "summarize",
    layout_reference: "evidence",
    motion_reference: "evidence",
  }[event.kind] ?? "explain";
};

const contentFor = (events) => {
  const text = events.map((event) => event.body ?? event.text ?? "").join("\n").trim();
  const title = events.find((event) => event.title)?.title ?? text.split(/\r?\n/, 1)[0] ?? "";
  const body = events.map((event) => event.body ?? event.text ?? "").join("\n").trim();
  const data = events.map((event) => event.data ?? {});
  const assetClassifications = [...new Set(data.flatMap((item) =>
    Array.isArray(item.assetClassifications)
      ? item.assetClassifications
      : item.assetClassification ? [item.assetClassification] : [],
  ))];
  const numericValueCount = data.flatMap((item) => Object.values(item)).filter(Number.isFinite).length;
  return {
    headlineChars: title.length,
    bodyChars: body.length,
    bulletItems: text.split(/\r?\n/).filter(Boolean).length,
    codeLines: events.filter((event) => event.kind === "code" || event.kind === "command" || event.kind === "output").flatMap((event) => (event.text ?? "").split(/\r?\n/)).filter(Boolean).length,
    dataSeries: data.reduce((count, item) => count + (Array.isArray(item.series) ? item.series.length : 0), 0),
    assetClassifications,
    hasStructuredNumericData: data.some((item) => item.hasStructuredNumericData === true || Array.isArray(item.series) || Array.isArray(item.metrics)) || numericValueCount > 0,
    datedEvents: data.reduce((count, item) => count + (Array.isArray(item.datedEvents) ? item.datedEvents.length : 0), 0),
    hasSourcedChronology: data.some((item) => item.hasSourcedChronology === true),
    title,
    body,
    role: events.find((event) => event.beatRole)?.beatRole ?? null,
    actors: [...new Set(events.flatMap((event) => event.actors ?? []))],
    factRefs: [...new Set(events.flatMap((event) => event.factRefs ?? []))],
    factualSourceIds: [...new Set(events.flatMap((event) => event.factualSourceIds ?? []))],
    visualConstraints: events.find((event) => event.visualConstraints)?.visualConstraints ?? null,
  };
};

const presetFor = (family, config) => {
  const preferred = {
    terminal: "command",
    code: "command",
    editorial: "headline-stat-grid",
    dashboard: "progress-steps",
    infographic: "headline-stat-grid",
    data_visualization: "progress-steps",
    product_demo: "split-screen",
    cinematic_typography: "cinematic-title-intro",
  }[family];
  if (config.mapping.allowedPresets.includes(preferred)) return preferred;
  return config.mapping.defaultPreset;
};

const styleFor = ({ events, config, knowledgeSelection, director, history }) => {
  const legacyFamily = legacyFamilyFor(events[0], config, knowledgeSelection);
  if (!config.run || !["auto", "locked"].includes(config.run.styleMode)) {
    return { legacyFamily, packageId: null, trace: null, intent: intentFor(events[0]) };
  }
  const scene = { intent: intentFor(events[0]), content: contentFor(events) };
  const trace = evaluateDirectorSelection({
    director,
    mode: config.run.styleMode,
    scene,
    lockedStyle: config.run.lockedStyle,
    evidence: directorEvidenceFor(events, knowledgeSelection),
    approvalRef: config.run.approvalRefs?.[0] ?? null,
    history,
  });
  const selected = trace.selected;
  return {
    legacyFamily: selected?.legacyFamily ?? legacyFamily,
    packageId: selected?.familyId ?? null,
    effectiveLayout: trace.selectedLayout ?? null,
    trace: {
      ...trace,
      semanticInputs: {
        eventId: events[0]?.id ?? null,
        beatId: events[0]?.beatId ?? null,
        title: scene.content.title,
        body: scene.content.body,
        intent: scene.intent,
        role: scene.content.role,
        actors: scene.content.actors,
        factRefs: scene.content.factRefs,
        factualSourceIds: scene.content.factualSourceIds,
        visualConstraints: scene.content.visualConstraints,
      },
    },
    intent: scene.intent,
  };
};

export const mapVisualScenes = (normalized, config, knowledgeSelection = null, options = {}) => {
  if (normalized.schemaVersion !== "normalized-visual-input/v1") {
    throw new Error(`Unsupported normalized schema: ${normalized.schemaVersion}`);
  }
  if (normalized.contentBrief) {
    assertValidContentBrief(normalized.contentBrief, { runEnvelope: config.run });
    assertNormalizedContentBriefBinding({
      brief: normalized.contentBrief,
      normalizedInput: normalized,
      sourceId: normalized.contentBriefProvenance?.sourceId,
      rawChecksum: normalized.contentBriefProvenance?.rawChecksum,
      expectedProjectId: config.projectId,
      ...(config.run ? { expectedRunId: config.run.runId } : {}),
    });
  }
  assertFactRefsUseFactualEvidence(normalized.events, knowledgeSelection);
  const fps = config.fps;
  const maxFrames = Math.round(config.mapping.maxSceneSeconds * fps);
  const minFrames = Math.round(config.mapping.minSceneSeconds * fps);
  const maxItems = config.mapping.maxItemsPerScene;
  const director = options.director ?? (config.run ? loadProductionDirector(options) : null);
  const narratives = normalized.events.filter((event) => event.kind === "narrative");
  const operational = normalized.events.filter((event) => ![
    "narrative", "resize", "layout_reference", "design_token", "motion_reference",
  ].includes(event.kind));
  const references = normalized.events.filter((event) => [
    "layout_reference", "design_token", "motion_reference",
  ].includes(event.kind));
  const scenes = [];
  const selectionHistory = { selectedFamilies: [], selectedLayouts: [] };

  const appendScene = ({ group, durationInFrames, fallbackTitle }) => {
    const style = styleFor({ events: group, config, knowledgeSelection, director, history: selectionHistory });
    scenes.push({
      sceneId: `${style.packageId ?? style.legacyFamily}-${String(scenes.length + 1).padStart(2, "0")}`,
      visualFamily: style.legacyFamily,
      ...(style.packageId ? { packageId: style.packageId, legacyFamily: style.legacyFamily } : {}),
      ...(style.effectiveLayout ? { effectiveLayout: style.effectiveLayout } : {}),
      preset: presetFor(style.legacyFamily, config),
      themeId: config.themeId,
      durationInFrames,
      title: titleFor(group[0], fallbackTitle),
      blocks: group.map((event, blockIndex) => makeBlock(event, blockIndex * Math.round(fps * 0.7))),
      knowledgeEvidence: evidenceFor(group, knowledgeSelection),
      ...(style.trace ? { directorSelection: style.trace, intent: style.intent } : {}),
    });
    if (style.packageId) selectionHistory.selectedFamilies.push(style.packageId);
    if (style.effectiveLayout) selectionHistory.selectedLayouts.push(style.effectiveLayout);
  };

  const narrativeGroups = normalized.contentBrief
    ? narratives.map((event) => [event])
    : Array.from({ length: Math.ceil(narratives.length / maxItems) }, (_, index) => narratives.slice(index * maxItems, (index + 1) * maxItems));
  for (const group of narrativeGroups) {
    appendScene({
      group,
      durationInFrames: Math.max(minFrames, Math.min(maxFrames, fps * (3 + group.length))),
      fallbackTitle: "Visual story",
    });
  }

  if (operational.length > 0) {
    const firstFrame = operational.find((event) => Number.isInteger(event.frame))?.frame ?? 0;
    const lastFrame = operational.reduce((max, event) => Math.max(max, event.frame ?? 0), 0);
    const group = operational.slice(0, maxItems);
    appendScene({
      group,
      durationInFrames: Math.max(minFrames, Math.min(maxFrames, lastFrame - firstFrame + fps * 2)),
      fallbackTitle: "Runtime output",
    });
    const scene = scenes.at(-1);
    scene.blocks = group.map((event) => makeBlock(event, Math.max(0, (event.frame ?? firstFrame) - firstFrame)));
  }

  for (let index = 0; index < references.length; index += maxItems) {
    const group = references.slice(index, index + maxItems);
    appendScene({
      group,
      durationInFrames: Math.max(minFrames, Math.min(maxFrames, fps * (3 + group.length * 0.6))),
      fallbackTitle: "Visual references",
    });
  }

  if (!scenes.length) throw new Error("No visual scenes could be mapped");
  const directorSelections = scenes.flatMap((scene) => scene.directorSelection ? [{
    sceneId: scene.sceneId,
    eventId: scene.blocks[0]?.sourceEventIds[0] ?? null,
    beatId: scene.blocks[0]?.beatId ?? null,
    eventIds: scene.blocks.flatMap((block) => block.sourceEventIds),
    semanticInputs: scene.directorSelection.semanticInputs,
    ...scene.directorSelection,
  }] : []);
  return {
    schemaVersion: "visual-scenes/v1",
    projectId: normalized.projectId,
    generatedAt: new Date().toISOString(),
    fps,
    themeId: config.themeId,
    knowledge: knowledgeSelection ? {
      enabled: knowledgeSelection.enabled,
      repository: knowledgeSelection.repository,
      manifestHash: knowledgeSelection.manifestHash,
      summary: knowledgeSelection.summary,
    } : null,
    directorSelection: config.run ? {
      schemaVersion: "director-selection-report/v1",
      runId: config.run.runId,
      mode: config.run.styleMode,
      manifestHash: knowledgeSelection?.manifestHash ?? null,
      selections: directorSelections,
    } : null,
    scenes,
  };
};
