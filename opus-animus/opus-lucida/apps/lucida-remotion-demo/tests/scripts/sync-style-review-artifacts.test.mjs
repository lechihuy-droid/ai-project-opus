import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const SCRIPT_PATH = path.join(
  APP_ROOT,
  "scripts",
  "sync-style-review-artifacts.mjs",
);
const PACKAGE_IDS = [
  "claim-evidence",
  "code-walkthrough",
  "news-rundown",
  "interface-walkthrough",
];

const EXPECTED_PLANS = [
  [
    "claim-evidence:claim-proof",
    "claim-evidence/claim-proof.png",
    "claim-evidence/scene-01.png",
  ],
  [
    "claim-evidence:pro-con",
    "claim-evidence/pro-con.png",
    "claim-evidence/scene-02.png",
  ],
  [
    "claim-evidence:benchmark-audit",
    "claim-evidence/benchmark-audit.png",
    "claim-evidence/scene-03.png",
  ],
  [
    "claim-evidence:myth-reality",
    "claim-evidence/myth-reality.png",
    "claim-evidence/scene-04.png",
  ],
  [
    "claim-evidence:source-triangulation",
    "claim-evidence/source-triangulation.png",
    "claim-evidence/scene-05.png",
  ],
  [
    "code-walkthrough:code-focus",
    "code-walkthrough/code-focus.png",
    "code-walkthrough/scene-01.png",
  ],
  [
    "code-walkthrough:diff-review",
    "code-walkthrough/diff-review.png",
    "code-walkthrough/scene-02.png",
  ],
  [
    "code-walkthrough:api-sequence",
    "code-walkthrough/api-sequence.png",
    "code-walkthrough/scene-03.png",
  ],
  [
    "code-walkthrough:debugging-trace",
    "code-walkthrough/debugging-trace.png",
    "code-walkthrough/scene-04.png",
  ],
  [
    "code-walkthrough:terminal-code-split",
    "code-walkthrough/terminal-code-split.png",
    "code-walkthrough/scene-05.png",
  ],
  [
    "news-rundown:breaking-brief",
    "news-rundown/breaking-brief.png",
    "news-rundown/scene-01.png",
  ],
  [
    "news-rundown:headline-stack",
    "news-rundown/headline-stack.png",
    "news-rundown/scene-02.png",
  ],
  [
    "news-rundown:live-update",
    "news-rundown/live-update.png",
    "news-rundown/scene-03.png",
  ],
  [
    "news-rundown:context-grid",
    "news-rundown/context-grid.png",
    "news-rundown/scene-04.png",
  ],
  [
    "news-rundown:data-watch",
    "news-rundown/data-watch.png",
    "news-rundown/scene-05.png",
  ],
  [
    "interface-walkthrough:dashboard-orientation",
    "interface-walkthrough/dashboard-orientation.png",
    "interface-walkthrough/scene-01.png",
  ],
  [
    "interface-walkthrough:workflow-stepper",
    "interface-walkthrough/workflow-stepper.png",
    "interface-walkthrough/scene-02.png",
  ],
  [
    "interface-walkthrough:settings-spotlight",
    "interface-walkthrough/settings-spotlight.png",
    "interface-walkthrough/scene-03.png",
  ],
  [
    "interface-walkthrough:data-table-inspect",
    "interface-walkthrough/data-table-inspect.png",
    "interface-walkthrough/scene-04.png",
  ],
  [
    "interface-walkthrough:mobile-flow",
    "interface-walkthrough/mobile-flow.png",
    "interface-walkthrough/scene-05.png",
  ],
];

const sha256 = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const packageSnapshot = () =>
  Object.fromEntries(
    PACKAGE_IDS.flatMap((packageId) => {
      const packageRoot = path.join(
        APP_ROOT,
        "design",
        "visual-library",
        "styles",
        packageId,
      );
      return fs
        .readdirSync(packageRoot, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const filePath = path.join(entry.parentPath, entry.name);
          return [
            path.relative(APP_ROOT, filePath).split(path.sep).join("/"),
            sha256(filePath),
          ];
        });
    }),
  );

const runSync = (...args) =>
  spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: APP_ROOT,
    encoding: "utf8",
  });

test("validate-only resolves the four supported packages to all 20 deterministic frame plans without writes", () => {
  const before = packageSnapshot();
  const result = runSync("--validate-only");
  const after = packageSnapshot();

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    after,
    before,
    "--validate-only must not modify package data",
  );

  const planLines = result.stdout
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("PLAN "));
  assert.equal(planLines.length, 20);
  assert.deepEqual(
    planLines,
    EXPECTED_PLANS.map(
      ([key, source, target]) =>
        `PLAN ${key} design/reports/style-rag-phase1-stills/stills/${source} -> design/visual-library/styles/${target.slice(0, target.lastIndexOf("/"))}/artifacts/frames/${target.slice(target.lastIndexOf("/") + 1)}`,
    ),
  );
  assert.match(
    result.stdout,
    /Validated 20 authoritative PNG mapping\(s\); no package data written\./,
  );
});

test("--package limits validation to one supported package", () => {
  const result = runSync("--validate-only", "--package", "news-rundown");

  assert.equal(result.status, 0, result.stderr);
  const planLines = result.stdout
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("PLAN "));
  assert.equal(planLines.length, 5);
  assert.ok(planLines.every((line) => line.startsWith("PLAN news-rundown:")));
  assert.match(
    result.stdout,
    /Validated 5 authoritative PNG mapping\(s\); no package data written\./,
  );
});
