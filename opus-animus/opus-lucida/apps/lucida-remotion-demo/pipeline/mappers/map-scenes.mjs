const clean = (text) => (text ?? "").replace(/\s+/g, " ").trim();

const makeBlock = (event, at = 0) => ({
  kind:
    event.kind === "narrative"
      ? "text"
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

export const mapVisualScenes = (normalized, config) => {
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
    (event) => event.kind !== "narrative" && event.kind !== "resize",
  );
  const scenes = [];

  for (let index = 0; index < narratives.length; index += maxItems) {
    const group = narratives.slice(index, index + maxItems);
    scenes.push({
      sceneId: `editorial-${String(scenes.length + 1).padStart(2, "0")}`,
      visualFamily: config.mapping.allowedFamilies.includes("editorial")
        ? "editorial"
        : config.mapping.defaultFamily,
      preset: config.mapping.allowedPresets.includes("headline-stat-grid")
        ? "headline-stat-grid"
        : config.mapping.defaultPreset,
      themeId: config.themeId,
      durationInFrames: Math.max(
        minFrames,
        Math.min(maxFrames, fps * (3 + group.length)),
      ),
      title: clean(group[0]?.text) || "Visual story",
      blocks: group.map((event, blockIndex) =>
        makeBlock(event, blockIndex * Math.round(fps * 0.7)),
      ),
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
    });
  }

  if (scenes.length === 0) throw new Error("No visual scenes could be mapped");
  return {
    schemaVersion: "visual-scenes/v1",
    projectId: normalized.projectId,
    generatedAt: new Date().toISOString(),
    fps,
    themeId: config.themeId,
    scenes,
  };
};
