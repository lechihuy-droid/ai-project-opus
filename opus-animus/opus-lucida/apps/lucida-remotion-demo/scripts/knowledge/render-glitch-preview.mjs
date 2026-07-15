#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { readJson, sha256File, writeStableJson } from "./index-utils.mjs";

const appRoot = process.cwd();
const fixturePath = path.join(appRoot, "pipeline", "fixtures", "knowledge", "glitch-text", "long-vietnamese-9x16.json");
const outputDir = path.join(appRoot, "output", "render", "knowledge", "glitch-text-preview");
const reportPath = path.join(appRoot, "design", "template-library", "glitch-text", "gate-a-report.json");
const knowledgeDir = path.join(appRoot, ".generated", "knowledge");
const frame = 45;

// A failed or interrupted rerender must not leave a stale passing gate report.
fs.rmSync(reportPath, { force: true });

const fixture = readJson(fixturePath);
const renderProps = { videoMap: fixture };
const renderPropsPath = path.join(outputDir, "render-props.json");

const renderedInputTemplateId = renderProps.videoMap?.scenes?.[0]?.templateId;
if (renderedInputTemplateId !== "glitch-text") {
  throw new Error(
    `Glitch preview props must resolve glitch-text; received ${String(renderedInputTemplateId)}.`,
  );
}

runNode("scripts/knowledge/compile.mjs");
runNode("scripts/knowledge/validate-index.mjs");
fs.mkdirSync(outputDir, { recursive: true });
writeStableJson(renderPropsPath, renderProps);

const outputs = ["first.png", "second.png"].map((name) => path.join(outputDir, name));
for (const output of outputs) {
  fs.rmSync(output, { force: true });
  const result = spawnSync(
    "npx",
    [
      "remotion",
      "still",
      "LucidaMotionDemo",
      output,
      `--frame=${frame}`,
      `--props=${renderPropsPath}`,
      "--image-format=png",
    ],
    { cwd: appRoot, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const firstHash = sha256File(outputs[0]);
const secondHash = sha256File(outputs[1]);
if (firstHash !== secondHash) {
  throw new Error(`Deterministic still checksum mismatch: ${firstHash} !== ${secondHash}.`);
}

const image = inspectPng(outputs[0]);
if (!image.nonBlank) {
  throw new Error("Glitch preview is blank or a single-color image.");
}
const safeArea = inspectSafeArea(image);
if (!safeArea.inside) {
  throw new Error(
    `Glitch preview pixels exceed the declared safe area: ${JSON.stringify(safeArea)}.`,
  );
}
const mp4Files = fs.readdirSync(outputDir).filter((file) => file.toLowerCase().endsWith(".mp4"));
if (mp4Files.length > 0) {
  throw new Error(`Glitch preview must not create MP4 output: ${mp4Files.join(", ")}.`);
}

const templateIndex = readJson(path.join(knowledgeDir, "template-index.json"));
const manifest = readJson(path.join(knowledgeDir, "manifest.json"));
const canonical = templateIndex.templates.find((template) => template.id === "glitch-text");
const provenance = readJson(path.join(appRoot, "design", "template-library", "glitch-text", "provenance.json"));
const manualMap = readJson(path.join(appRoot, "src", "template-registry-map.json"));

if (!canonical || canonical.adapterId !== "GlitchTextAdapter") {
  throw new Error("Canonical glitch-text entry does not resolve GlitchTextAdapter.");
}
if (Object.prototype.hasOwnProperty.call(manualMap, "glitch-text")) {
  throw new Error("glitch-text remains in the legacy template registry map.");
}

writeStableJson(reportPath, {
  schemaVersion: "lucida-gate-a-report/v1",
  gate: "A",
  templateId: "glitch-text",
  status: "passed",
  checks: [
    {
      id: "canonical-package",
      status: "passed",
      evidence: {
        logicalId: canonical.logicalId,
        contentHash: canonical.contentHash,
        package: canonical.paths.package,
      },
    },
    {
      id: "provenance",
      status: "passed",
      evidence: {
        repository: provenance.source.repository,
        localCommitPin: provenance.source.localCommitPin,
        reviewStatus: provenance.license.reviewStatus,
      },
    },
    {
      id: "schema",
      status: "passed",
      evidence: { validator: "scripts/knowledge/validate.mjs" },
    },
    {
      id: "dedicated-adapter",
      status: "passed",
      evidence: {
        adapterId: canonical.adapterId,
        adapterPath: canonical.paths.adapter,
        adapterSourceHash: canonical.sourceHashes[canonical.paths.adapter],
      },
    },
    {
      id: "generated-index",
      status: "passed",
      evidence: {
        manifestHash: manifest.manifestHash,
        familyId: canonical.familyId,
        preset: canonical.capabilities.presets[0],
        status: canonical.status,
      },
    },
    {
      id: "deterministic-preview",
      status: "passed",
      evidence: {
        fixture: "pipeline/fixtures/knowledge/glitch-text/long-vietnamese-9x16.json",
        props: "output/render/knowledge/glitch-text-preview/render-props.json",
        propsShape: "{ videoMap: VideoMap }",
        renderedInputTemplateId,
        frame,
        width: image.width,
        height: image.height,
        checksum: firstHash,
        secondChecksum: secondHash,
        nonBlank: image.nonBlank,
        bbox: image.bbox,
        nonBackgroundPixelCount: image.nonBackgroundPixelCount,
        safeArea,
        mp4Files,
      },
    },
    {
      id: "no-manual-map",
      status: "passed",
      evidence: { map: "src/template-registry-map.json" },
    },
    {
      id: "safe-area-pixels",
      status: "passed",
      evidence: safeArea,
    },
  ],
});

console.log(`Glitch Text deterministic preview passed: ${firstHash}`);

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: appRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function inspectPng(filePath) {
  const input = fs.readFileSync(filePath);
  const signature = "89504e470d0a1a0a";
  if (input.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`Preview is not a PNG: ${path.relative(appRoot, filePath)}.`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bytesPerPixel = 0;
  const compressed = [];
  while (offset < input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.subarray(offset + 4, offset + 8).toString("ascii");
    const data = input.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      const colorType = data[9];
      const interlace = data[12];
      const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
      if (bitDepth !== 8 || interlace !== 0 || channels === 0) {
        throw new Error("Preview PNG must be non-interlaced 8-bit RGB or RGBA.");
      }
      bytesPerPixel = channels;
    }
    if (type === "IDAT") {
      compressed.push(data);
    }
  }

  const raw = zlib.inflateSync(Buffer.concat(compressed));
  const stride = width * bytesPerPixel;
  const previous = Buffer.alloc(stride);
  let cursor = 0;
  let min = 255;
  let max = 0;
  const background = [11, 13, 18];
  const bbox = { minX: width, minY: height, maxX: -1, maxY: -1 };
  let nonBackgroundPixelCount = 0;
  for (let row = 0; row < height; row += 1) {
    const filter = raw[cursor++];
    const current = raw.subarray(cursor, cursor + stride);
    cursor += stride;
    for (let column = 0; column < stride; column += 1) {
      const left = column >= bytesPerPixel ? current[column - bytesPerPixel] : 0;
      const up = previous[column];
      const upLeft = column >= bytesPerPixel ? previous[column - bytesPerPixel] : 0;
      if (filter === 1) current[column] = (current[column] + left) & 0xff;
      if (filter === 2) current[column] = (current[column] + up) & 0xff;
      if (filter === 3) current[column] = (current[column] + Math.floor((left + up) / 2)) & 0xff;
      if (filter === 4) current[column] = (current[column] + paeth(left, up, upLeft)) & 0xff;
      if (filter > 4) throw new Error(`Unsupported PNG filter: ${filter}.`);
      if (column % bytesPerPixel < 3) {
        min = Math.min(min, current[column]);
        max = Math.max(max, current[column]);
      }
    }
    for (let x = 0; x < width; x += 1) {
      const pixel = x * bytesPerPixel;
      if (
        current[pixel] !== background[0]
        || current[pixel + 1] !== background[1]
        || current[pixel + 2] !== background[2]
      ) {
        nonBackgroundPixelCount += 1;
        bbox.minX = Math.min(bbox.minX, x);
        bbox.minY = Math.min(bbox.minY, row);
        bbox.maxX = Math.max(bbox.maxX, x);
        bbox.maxY = Math.max(bbox.maxY, row);
      }
    }
    current.copy(previous);
  }
  return {
    width,
    height,
    nonBlank: min !== max,
    bbox: nonBackgroundPixelCount > 0 ? bbox : null,
    nonBackgroundPixelCount,
  };
}

function inspectSafeArea(image) {
  const inset = {
    left: Math.ceil(image.width * 0.1),
    right: Math.ceil(image.width * 0.1),
    top: Math.ceil(image.height * 0.12),
    bottom: Math.ceil(image.height * 0.16),
  };
  const bounds = {
    minX: inset.left,
    maxX: image.width - inset.right - 1,
    minY: inset.top,
    maxY: image.height - inset.bottom - 1,
  };
  const bbox = image.bbox;
  const margins = bbox
    ? {
      left: bbox.minX,
      right: image.width - bbox.maxX - 1,
      top: bbox.minY,
      bottom: image.height - bbox.maxY - 1,
    }
    : null;
  return {
    inset,
    bounds,
    bbox,
    margins,
    inside: Boolean(
      bbox
      && bbox.minX >= bounds.minX
      && bbox.maxX <= bounds.maxX
      && bbox.minY >= bounds.minY
      && bbox.maxY <= bounds.maxY,
    ),
  };
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}
