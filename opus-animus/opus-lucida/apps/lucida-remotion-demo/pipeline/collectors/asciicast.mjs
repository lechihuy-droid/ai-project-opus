import fs from "node:fs";
import path from "node:path";
import { makeProvenance, resolveInside, sha256 } from "./shared.mjs";

const VERSION = "asciicast-v2-collector/1";
const supportedCodes = new Set(["o", "m", "r"]);

export const collectAsciicast = ({ source, projectRoot }) => {
  if (!source.path)
    throw new Error(`Asciicast source ${source.id} requires path`);
  if (source.captureInputEvents)
    throw new Error("Asciicast input-event capture is disabled by policy");

  const filePath = resolveInside(projectRoot, source.path);
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 1) throw new Error("Asciicast file is empty");

  const header = JSON.parse(lines[0]);
  if (header.version !== 2)
    throw new Error(`Unsupported asciicast version: ${header.version}`);
  if (!Number.isInteger(header.width) || !Number.isInteger(header.height)) {
    throw new Error("Asciicast header requires integer width and height");
  }

  const checksum = sha256(raw);
  const baseRef = path.relative(projectRoot, filePath).replaceAll("\\", "/");
  const records = [];

  for (let index = 1; index < lines.length; index += 1) {
    const event = JSON.parse(lines[index]);
    if (!Array.isArray(event) || event.length !== 3)
      throw new Error(`Malformed asciicast event at line ${index + 1}`);
    const [timeSeconds, code, data] = event;
    if (code === "i" || !supportedCodes.has(code)) continue;
    records.push({
      kind: code === "o" ? "output" : code === "m" ? "marker" : "resize",
      timeSeconds,
      data,
      provenance: makeProvenance({
        source,
        sourceRef: `${baseRef}#event-${index}`,
        checksum,
        version: VERSION,
      }),
    });
  }

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum,
    metadata: {
      width: header.width,
      height: header.height,
      duration: header.duration ?? null,
      title: header.title ?? null,
      theme: header.theme ?? null,
    },
    records,
  };
};
