import crypto from "node:crypto";
import path from "node:path";

export const sha256 = (value) =>
  `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

export const resolveInside = (root, candidate) => {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, candidate);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes approved root: ${candidate}`);
  }
  return resolved;
};

export const makeProvenance = ({ source, sourceRef, checksum, version }) => ({
  sourceId: source.id,
  sourceRef,
  sourceChecksum: checksum,
  collectorVersion: version,
});
