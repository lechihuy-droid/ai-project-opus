import fs from "node:fs";
import path from "node:path";
import { makeProvenance, resolveInside, sha256 } from "./shared.mjs";

const VERSION = "script-collector/1";

export const collectScript = ({ source, projectRoot }) => {
  if (!source.path) {
    throw new Error(`Script source ${source.id} requires a local path`);
  }
  const filePath = resolveInside(projectRoot, source.path);
  const text = fs.readFileSync(filePath, "utf8");
  const checksum = sha256(text);
  const sourceRef = path.relative(projectRoot, filePath).replaceAll("\\", "/");
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum,
    records: blocks.map((text, index) => ({
      kind: "script_block",
      index,
      text,
      data: {
        ...(source.family ? { visualFamily: source.family } : {}),
        ...(source.tags?.length ? { tags: source.tags } : {}),
      },
      provenance: makeProvenance({
        source,
        sourceRef: `${sourceRef}#block-${index + 1}`,
        checksum,
        version: VERSION,
      }),
    })),
  };
};
