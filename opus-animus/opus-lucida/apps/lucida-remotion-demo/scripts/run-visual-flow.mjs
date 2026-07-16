import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const config = valueAfter("--config");
if (!config)
  throw new Error(
    "Usage: npm run visual-flow -- --config <config.json> [--run-id <id>] [--no-preview] [--no-render] [--no-knowledge-refresh]",
  );
const root = process.cwd();
const configDefinition = JSON.parse(fs.readFileSync(path.resolve(root, config), "utf8"));
const runId = valueAfter("--run-id") ?? `visual-${Date.now()}`;
const runDir = `pipeline/runs/${runId}`;
const noPreview = args.includes("--no-preview");
const noRender = args.includes("--no-render");
const noKnowledgeRefresh = args.includes("--no-knowledge-refresh");

const run = (script, scriptArgs) => {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const startedAt = new Date().toISOString();
run("scripts/collect-visual-inputs.mjs", ["--config", config, "--out", runDir]);
run("scripts/process-visual-inputs.mjs", [
  "--input",
  `${runDir}/01-raw-input.json`,
  "--config",
  config,
]);
const knowledgeEnabled = configDefinition.knowledge?.enabled === true;
const refreshKnowledge = knowledgeEnabled
  && configDefinition.knowledge?.refreshProjection !== false
  && !noKnowledgeRefresh;
if (refreshKnowledge) {
  run("scripts/knowledge/compile.mjs", []);
  if ((configDefinition.knowledge?.repository ?? "sqlite") === "sqlite") {
    run("scripts/knowledge/build-sqlite.mjs", []);
  }
}
run("scripts/map-and-compile-visual-scenes.mjs", [
  "--input",
  `${runDir}/03-normalized-input.json`,
  "--config",
  config,
]);
run("scripts/validate-generated-video-map.mjs", [
  "--input",
  `${runDir}/05-video-map.json`,
]);
if (!noPreview)
  run("scripts/preview-generated-video.mjs", [
    "--props",
    `${runDir}/render-props.json`,
  ]);
if (!noRender)
  run("scripts/render-generated-video.mjs", [
    "--props",
    `${runDir}/render-props.json`,
  ]);

const report = {
  ok: true,
  runId,
  startedAt,
  completedAt: new Date().toISOString(),
  config,
  stages: {
    collect: "completed",
    sanitize: "completed",
    normalize: "completed",
    knowledgeCompile: refreshKnowledge ? "completed" : "skipped",
    knowledgeBuild: refreshKnowledge && (configDefinition.knowledge?.repository ?? "sqlite") === "sqlite"
      ? "completed"
      : "skipped",
    knowledgeRetrieve: knowledgeEnabled ? "completed" : "skipped",
    map: "completed",
    compile: "completed",
    validate: "completed",
    preview: noPreview ? "skipped" : "completed",
    render: noRender ? "skipped" : "completed",
  },
};
fs.writeFileSync(
  path.resolve(root, runDir, "report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`Visual flow completed: ${path.resolve(root, runDir)}`);
