import {pathToFileURL} from "node:url";

export const NODE_VERSION_RANGE = ">=24.14 <25";

export const parseNodeVersion = (version) => {
  if (typeof version !== "string") {
    return null;
  }

  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

export const isSupportedNodeVersion = (version) => {
  const parsed = parseNodeVersion(version);
  return parsed !== null && parsed.major === 24 && parsed.minor >= 14;
};

export const assertSupportedNodeVersion = (version) => {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(
      `Lucida Local RAG requires Node ${NODE_VERSION_RANGE}; received ${JSON.stringify(version)}.`,
    );
  }
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    assertSupportedNodeVersion(process.version);
    console.log(`Node ${process.version} satisfies ${NODE_VERSION_RANGE}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
