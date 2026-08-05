import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const defaultIsPidAlive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
};

const isContained = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};
const isContainedOrEqual = (root, candidate) => candidate === root || isContained(root, candidate);

const nearestExistingAncestor = (candidate) => {
  let current = path.resolve(candidate);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return current;
};

const resolveApprovedRoot = (approvedRoot) => {
  const lexical = path.resolve(approvedRoot);
  if (!fs.statSync(lexical, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Approved render root must exist and be a directory: ${lexical}`);
  }
  return { lexical, real: fs.realpathSync(lexical) };
};

const assertSafeRunRoot = ({ lexicalApprovedRoot, realApprovedRoot, runRoot }) => {
  const requested = path.resolve(runRoot);
  if (!isContained(lexicalApprovedRoot, requested)) throw new Error(`Render lock path escapes approved root: ${requested}`);
  const existingAncestor = nearestExistingAncestor(requested);
  const realAncestor = existingAncestor ? fs.realpathSync(existingAncestor) : null;
  if (!realAncestor || !isContainedOrEqual(realApprovedRoot, realAncestor)) {
    throw new Error(`Render lock path escapes approved root: ${requested}`);
  }
  fs.mkdirSync(requested, { recursive: true });
  const realRunRoot = fs.realpathSync(requested);
  if (!isContained(realApprovedRoot, realRunRoot)) throw new Error(`Render lock path escapes approved root: ${requested}`);
  return realRunRoot;
};

const readMetadata = (lockDir) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(lockDir, "owner.json"), "utf8"));
  } catch {
    return null;
  }
};

const lockAgeMs = ({ lockDir, metadata, now }) => {
  const metadataTime = Date.parse(metadata?.acquiredAt ?? "");
  if (Number.isFinite(metadataTime)) return now().getTime() - metadataTime;
  return now().getTime() - fs.statSync(lockDir).mtimeMs;
};

export class RenderLockError extends Error {}

export const acquireRenderLock = ({
  approvedRoot,
  runRoot,
  runId,
  pid = process.pid,
  now = () => new Date(),
  isPidAlive = defaultIsPidAlive,
  staleMs = 30 * 60 * 1000,
}) => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(runId ?? "")) throw new Error("Invalid render lock run ID.");
  const approved = resolveApprovedRoot(approvedRoot);
  const realApprovedRoot = approved.real;
  const realRunRoot = assertSafeRunRoot({ lexicalApprovedRoot: approved.lexical, realApprovedRoot, runRoot });
  const lockDir = path.join(realApprovedRoot, ".render.lock");
  const legacyLockDir = path.join(realRunRoot, ".render.lock");
  const ownerToken = crypto.randomUUID();

  const create = () => {
    fs.mkdirSync(lockDir);
    const metadata = {
      schemaVersion: "lucida-render-lock/v1",
      runId,
      runRoot: realRunRoot,
      pid,
      acquiredAt: now().toISOString(),
      ownerToken,
    };
    try {
      fs.writeFileSync(path.join(lockDir, "owner.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    } catch (error) {
      fs.rmSync(lockDir, { recursive: true, force: true });
      throw error;
    }
    return { lockDir, metadata };
  };

  if (fs.existsSync(legacyLockDir)) {
    const legacyMetadata = readMetadata(legacyLockDir);
    const legacyAgeMs = lockAgeMs({ lockDir: legacyLockDir, metadata: legacyMetadata, now });
    if (legacyAgeMs < staleMs || legacyMetadata?.pid && isPidAlive(legacyMetadata.pid)) {
      throw new RenderLockError("Active competing legacy render lock blocks global lock acquisition.");
    }
    fs.rmSync(legacyLockDir, { recursive: true, force: true });
  }

  try {
    const created = create();
    return {
      ...created,
      release: () => releaseRenderLock({ approvedRoot: realApprovedRoot, ownerToken }),
    };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  const existing = readMetadata(lockDir);
  const ageMs = lockAgeMs({ lockDir, metadata: existing, now });
  const ownerAlive = existing ? isPidAlive(existing.pid) : false;
  if (ownerAlive || ageMs < staleMs) {
    throw new RenderLockError(`Active competing render lock (run=${existing?.runId ?? "unknown"}, pid=${existing?.pid ?? "unknown"}, acquiredAt=${existing?.acquiredAt ?? "unknown"}).`);
  }

  const recoveredDir = path.join(realApprovedRoot, `.render.lock.recovered-${ownerToken}`);
  try {
    fs.renameSync(lockDir, recoveredDir);
  } catch (error) {
    throw new RenderLockError(`Could not safely recover stale render lock: ${error.message}`);
  }
  fs.rmSync(recoveredDir, { recursive: true, force: true });
  try {
    const created = create();
    return {
      ...created,
      recovered: existing,
      release: () => releaseRenderLock({ approvedRoot: realApprovedRoot, ownerToken }),
    };
  } catch (error) {
    if (error?.code === "EEXIST") throw new RenderLockError("Competing render acquired global lock while recovering stale lock.");
    throw error;
  }
};

export const releaseRenderLock = ({ approvedRoot, ownerToken }) => {
  const realApprovedRoot = resolveApprovedRoot(approvedRoot).real;
  const lockDir = path.join(realApprovedRoot, ".render.lock");
  const metadata = readMetadata(lockDir);
  if (!metadata) return false;
  if (metadata.ownerToken !== ownerToken) throw new RenderLockError("Only the render lock owner may release the lock.");
  fs.rmSync(lockDir, { recursive: true, force: true });
  return true;
};
