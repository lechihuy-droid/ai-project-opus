const clean = (text) => (text ?? "").replace(/\s+/g, " ").trim();
const titleFor = (event, fallback) => clean(event?.text?.split(/\r?\n/, 1)[0]) || fallback;

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
  text: clean(event.text) || undefined,
  data: event.data,
  sourceEventIds: [event.id],
});

const selectionFor = (event, knowledgeSelection) =>
  knowledgeSelection?.selections?.find((selection) => selection.eventId === event.id);

const evidenceFor = (events, knowledgeSelection) => [
  ...new Set(events.flatMap((event) =>
    selectionFor(event, knowledgeSelection)?.evidence?.map((item) => item.id) ?? [])),
];

const familyFor = (event, config, knowledgeSelection) => {
  const requested = event.data?.family ?? event.data?.visualFamily;
  if (config.mapping.allowedFamilies.includes(requested)) return requested;
  const recommended = selectionFor(event, knowledgeSelection)?.recommendedFamily;
  if (config.mapping.allowedFamilies.includes(recommended)) return recommended;
  if (event.kind === "narrative" && config.mapping.allowedFamilies.includes("editorial"))
    return "editorial";
  if (event.kind === "code" && config.mapping.allowedFamilies.includes("code"))
    return "code";
  if (
    event.kind === "design_token" &&
    config.mapping.allowedFamilies.includes("dashboard")
  )
    return "dashboard";
  if (
    event.kind === "layout_reference" &&
    config.mapping.allowedFamilies.includes("editorial")
  )
    return "editorial";
  return config.mapping.defaultFamily;
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

export const mapVisualScenes = (normalized, config, knowledgeSelection = null) => {
  if (normalized.schemaVersion !== "normalized-visual-input/v1") {
    throw new Error(
      `Unsupported normalized schema: ${normalized.schemaVersion}`,
    );
  }

  const fps = config.fps;
  const maxFrames = Math.round(config.mapping.maxSceneSeconds * fps);
  const minFrames = Math.round(config.mapping.minSceneSeconds * fps);
  const maxItems = config.mapping.maxItemsPerScene;
  const narratives = normalized.events.filter(
    (event) => event.kind === "narrative",
  );
  const operational = normalized.events.filter(
    (event) =>
      ![
        "narrative",
        "resize",
        "layout_reference",
        "design_token",
        "motion_reference",
      ].includes(event.kind),
  );
  const references = normalized.events.filter((event) =>
    ["layout_reference", "design_token", "motion_reference"].includes(
      event.kind,
    ),
  );
  const scenes = [];

  for (let index = 0; index < narratives.length; index += maxItems) {
    const group = narratives.slice(index, index + maxItems);
    const visualFamily = familyFor(group[0], config, knowledgeSelection);
    scenes.push({
      sceneId: `${visualFamily}-${String(scenes.length + 1).padStart(2, "0")}`,
      visualFamily,
      preset: presetFor(visualFamily, config),
      themeId: config.themeId,
      durationInFrames: Math.max(
        minFrames,
        Math.min(maxFrames, fps * (3 + group.length)),
      ),
      title: titleFor(group[0], "Visual story"),
      blocks: group.map((event, blockIndex) =>
        makeBlock(event, blockIndex * Math.round(fps * 0.7)),
      ),
      knowledgeEvidence: evidenceFor(group, knowledgeSelection),
    });
  }

  if (operational.length > 0) {
    const firstFrame =
      operational.find((event) => Number.isInteger(event.frame))?.frame ?? 0;
    const lastFrame = operational.reduce(
      (max, event) => Math.max(max, event.frame ?? 0),
      0,
    );
    scenes.push({
      sceneId: `terminal-${String(scenes.length + 1).padStart(2, "0")}`,
      visualFamily: config.mapping.allowedFamilies.includes("terminal")
        ? "terminal"
        : config.mapping.defaultFamily,
      preset: config.mapping.allowedPresets.includes("command")
        ? "command"
        : config.mapping.defaultPreset,
      themeId: config.themeId,
      durationInFrames: Math.max(
        minFrames,
        Math.min(maxFrames, lastFrame - firstFrame + fps * 2),
      ),
      title: "Runtime output",
      blocks: operational
        .slice(0, maxItems)
        .map((event) =>
          makeBlock(
            event,
            Math.max(0, (event.frame ?? firstFrame) - firstFrame),
          ),
        ),
      knowledgeEvidence: evidenceFor(operational.slice(0, maxItems), knowledgeSelection),
    });
  }

  const referencesByFamily = new Map();
  for (const event of references) {
    const family = familyFor(event, config, knowledgeSelection);
    referencesByFamily.set(family, [
      ...(referencesByFamily.get(family) ?? []),
      event,
    ]);
  }
  for (const [family, familyReferences] of referencesByFamily.entries()) {
    for (let index = 0; index < familyReferences.length; index += maxItems) {
      const group = familyReferences.slice(index, index + maxItems);
      scenes.push({
        sceneId: `reference-${String(scenes.length + 1).padStart(2, "0")}`,
        visualFamily: family,
        preset: presetFor(family, config),
        themeId: config.themeId,
        durationInFrames: Math.max(
          minFrames,
          Math.min(maxFrames, fps * (3 + group.length * 0.6)),
        ),
        title: titleFor(group[0], "Visual references"),
        blocks: group.map((event, blockIndex) =>
          makeBlock(event, blockIndex * Math.round(fps * 0.45)),
        ),
        knowledgeEvidence: evidenceFor(group, knowledgeSelection),
      });
    }
  }

  if (scenes.length === 0) throw new Error("No visual scenes could be mapped");
  return {
    schemaVersion: "visual-scenes/v1",
    projectId: normalized.projectId,
    generatedAt: new Date().toISOString(),
    fps,
    themeId: config.themeId,
    knowledge: knowledgeSelection
      ? {
          enabled: knowledgeSelection.enabled,
          repository: knowledgeSelection.repository,
          manifestHash: knowledgeSelection.manifestHash,
          summary: knowledgeSelection.summary,
        }
      : null,
    scenes,
  };
};
