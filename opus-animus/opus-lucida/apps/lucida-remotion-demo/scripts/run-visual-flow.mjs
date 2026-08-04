import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validateVisualFlow } from "../pipeline/contracts/visual-flow-contracts.mjs";
import { writeJson } from "./operating-model/orchestration.mjs";

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
const validation = validateVisualFlow(configDefinition, {
  onWarning: (warning) => console.warn(`WARNING: ${warning}`),
});
if (validation.errors.length) throw new Error(`Invalid visual flow: ${validation.errors.join("; ")}`);
const effectiveConfig = validation.adapted ?? configDefinition;
if (effectiveConfig.run.lane !== "rapid-visual-pilot") {
  throw new Error("visual-flow only runs rapid-visual-pilot configs; use flow:promote and flow:run for production");
}
const runId = valueAfter("--run-id") ?? effectiveConfig.run.runId;
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(runId)) {
  throw new Error("--run-id and run.runId may contain only letters, numbers, dot, underscore, and hyphen");
}
const runDir = `pipeline/runs/${runId}`;
const noPreview = args.includes("--no-preview");
const noRender = args.includes("--no-render");
const noKnowledgeRefresh = args.includes("--no-knowledge-refresh");
const effectiveEnvelope = {
  ...effectiveConfig.run,
  runId,
  lane: "rapid-visual-pilot",
  publicationStatus: "non_publishable",
  approvalRefs: [],
};
const effectiveConfigPath = path.resolve(root, runDir, "visual-flow.effective.json");
fs.mkdirSync(path.resolve(root, runDir), { recursive: true });
writeJson(path.resolve(root, runDir, "run-envelope.json"), effectiveEnvelope);
writeJson(effectiveConfigPath, { ...effectiveConfig, run: effectiveEnvelope });

const run = (script, scriptArgs) => {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const startedAt = new Date().toISOString();
run("scripts/collect-visual-inputs.mjs", ["--config", path.relative(root, effectiveConfigPath), "--out", runDir]);
run("scripts/process-visual-inputs.mjs", [
  "--input",
  `${runDir}/01-raw-input.json`,
  "--config",
  path.relative(root, effectiveConfigPath),
]);
const knowledgeEnabled = effectiveConfig.knowledge?.enabled === true;
const refreshKnowledge = knowledgeEnabled
  && effectiveConfig.knowledge?.refreshProjection !== false
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
  path.relative(root, effectiveConfigPath),
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
  effectiveEnvelope,
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
