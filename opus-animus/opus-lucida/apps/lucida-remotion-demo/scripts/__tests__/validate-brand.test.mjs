import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const appRoot = path.resolve(import.meta.dirname, "../..");
const validator = path.join(appRoot, "scripts/validate-brand.mjs");

const videoMap = (language) => ({
  brand: {
    id: "lucida-ai-v1",
    series: "lucida-now",
    contractRef: "docs/market-research/11-pipeline-contract.md",
  },
  video: {
    title: "Brand validation",
    subtitle: "Regression test",
    format: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    durationSec: 6,
    style: "editorial",
    language,
  },
  theme: {
    name: "dark",
    accent: "#4CC2FF",
    accentSoft: "#17384A",
    background: "#081018",
    foreground: "#F5F7FA",
    muted: "#87919C",
  },
  assets: [],
  scenes: [
    { id: "hook", intent: "hook" },
    { id: "takeaway", intent: "takeaway" },
  ],
});

const validate = (language) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-brand-"));
  const input = path.join(directory, "video-map.json");
  fs.writeFileSync(input, `${JSON.stringify(videoMap(language))}\n`, "utf8");
  try {
    return spawnSync(process.execPath, [validator, "--input", input], {
      cwd: appRoot,
      encoding: "utf8",
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

test("brand validator accepts each schema-supported language", () => {
  for (const language of ["vi", "en"]) {
    const result = validate(language);
    assert.equal(result.status, 0, result.stderr);
  }
});

test("brand validator rejects languages outside the video-map schema", () => {
  const result = validate("ja");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /video\.language must be one of vi, en; got "ja"/);
});
