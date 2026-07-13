#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const stylesRoot = path.join(root, "design/visual-library/styles");
const outputDir = path.join(root, "design/visual-library/reports/preview-boards");
const reportPath = path.join(outputDir, "preview-boards.json");

const normalize = (value) => value.split(path.sep).join("/");
const relative = (value) => normalize(path.relative(root, value));
const hash = (value) =>
  crypto.createHash("sha256").update(fs.readFileSync(value)).digest("hex");

const resolvePackageRef = (packageDir, ref) => {
  const resolved = path.resolve(packageDir, ref);
  const projectRelative = path.relative(root, resolved);
  if (
    path.isAbsolute(projectRelative) ||
    projectRelative.startsWith("..") ||
    path.extname(resolved).toLowerCase() !== ".png"
  ) {
    throw new Error(`Invalid preview frame reference: ${ref}`);
  }
  return resolved;
};

const packageDirs = fs
  .readdirSync(stylesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(stylesRoot, entry.name))
  .filter((dir) => fs.existsSync(path.join(dir, "style-package.json")))
  .sort();

fs.mkdirSync(outputDir, { recursive: true });
const boards = [];

for (const packageDir of packageDirs) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(packageDir, "style-package.json"), "utf8"),
  );
  const refs = pkg.validationArtifacts?.previewFrames ?? [];
  if (refs.length < 3) {
    throw new Error(`${pkg.id} has fewer than three preview frames`);
  }

  const inputs = refs.map((ref) => resolvePackageRef(packageDir, ref));
  for (const input of inputs) {
    if (!fs.existsSync(input)) {
      throw new Error(`Missing preview frame: ${relative(input)}`);
    }
  }

  const output = path.join(outputDir, `${pkg.id}.png`);
  const hasFourFrames = inputs.length === 4;
  if (inputs.length !== 3 && !hasFourFrames) {
    throw new Error(`${pkg.id} preview board supports exactly three or four frames`);
  }
  const tile = hasFourFrames
    ? { width: 540, height: 960 }
    : { width: 360, height: 640 };
  const filter = inputs
    .map(
      (_, index) =>
        `[${index}:v]scale=${tile.width}:${tile.height}:force_original_aspect_ratio=decrease,` +
        `pad=${tile.width}:${tile.height}:(ow-iw)/2:(oh-ih)/2:color=0x080808[t${index}]`,
    )
    .join(";");
  const stack = hasFourFrames
    ? `${filter};[t0][t1][t2][t3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[out]`
    : `${filter};[t0][t1][t2]hstack=inputs=3[out]`;
  const args = [
    "-y",
    ...inputs.flatMap((input) => ["-i", input]),
    "-filter_complex",
    stack,
    "-map",
    "[out]",
    "-frames:v",
    "1",
    output,
  ];
  const rendered = spawnSync("ffmpeg", args, {
    cwd: root,
    encoding: "utf8",
  });
  if (rendered.status !== 0) {
    throw new Error(rendered.stderr || `ffmpeg failed for ${pkg.id}`);
  }

  boards.push({
    id: pkg.id,
    status: pkg.status,
    output: relative(output),
    dimensions: { width: 1080, height: hasFourFrames ? 1920 : 640 },
    sha256: hash(output),
    fileBytes: fs.statSync(output).size,
    sourceFrames: inputs.map((input) => ({
      path: relative(input),
      sha256: hash(input),
    })),
  });
}

const report = {
  schemaVersion: "lucida-style-preview-boards/v1",
  generatedAt: new Date().toISOString(),
  status: boards.length === 9 ? "pass" : "fail",
  expectedBoardCount: 9,
  boardCount: boards.length,
  videoBinaryRegistered: false,
  boards,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Preview boards: ${report.status.toUpperCase()} (${boards.length}/9) -> ${relative(outputDir)}`,
);
process.exit(report.status === "pass" ? 0 : 1);
