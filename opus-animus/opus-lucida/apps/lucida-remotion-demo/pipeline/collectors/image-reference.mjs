import fs from "node:fs";
import path from "node:path";
import {
  fetchHead,
  makeProvenance,
  resolveInside,
  sha256,
} from "./shared.mjs";

const VERSION = "image-reference-collector/1";

const statLocalImage = (projectRoot, sourcePath) => {
  const filePath = resolveInside(projectRoot, sourcePath);
  const bytes = fs.readFileSync(filePath);
  return {
    ref: path.relative(projectRoot, filePath).replaceAll("\\", "/"),
    checksum: sha256(bytes),
    contentLength: String(bytes.byteLength),
    contentType: "",
  };
};

export const collectImageReference = async ({ source, projectRoot }) => {
  const refs = source.urls?.length
    ? source.urls.map((url) => ({ kind: "url", value: url }))
    : source.url
      ? [{ kind: "url", value: source.url }]
      : source.path
        ? [{ kind: "path", value: source.path }]
        : [];
  if (!refs.length) {
    throw new Error(`Image reference ${source.id} requires url(s) or path`);
  }

  const records = [];
  const metadata = [];
  for (const [index, ref] of refs.entries()) {
    const info =
      ref.kind === "path"
        ? statLocalImage(projectRoot, ref.value)
        : {
            ref: ref.value,
            checksum: sha256(ref.value),
            ...(await fetchHead(ref.value)),
          };
    metadata.push(info);
    records.push({
      kind: "media",
      index,
      text: source.notes?.[index] ?? source.note ?? `Image reference: ${info.ref}`,
      data: {
        url: ref.kind === "url" ? ref.value : undefined,
        path: ref.kind === "path" ? info.ref : undefined,
        contentType: info.contentType,
        contentLength: info.contentLength,
        family: source.family,
        tags: source.tags ?? [],
      },
      provenance: makeProvenance({
        source,
        sourceRef: info.ref,
        checksum: info.checksum,
        version: VERSION,
      }),
    });
  }

  return {
    sourceId: source.id,
    sourceType: source.type,
    collectorVersion: VERSION,
    checksum: sha256(JSON.stringify(metadata)),
    metadata,
    records,
  };
};
