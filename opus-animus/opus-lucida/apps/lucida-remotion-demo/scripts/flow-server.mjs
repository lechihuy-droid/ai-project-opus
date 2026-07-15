#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runsRoot = path.join(root, "output", "render", "flow-runs");
const host = "127.0.0.1";
const port = 8790;

const json = (response, statusCode, body) => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(body)}\n`);
};

const safeRunId = (value) =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value) ? value : null;

const repoFile = (value) => {
  if (typeof value !== "string" || !value.trim()) throw new Error("script and videoMap must be non-empty paths");
  const resolved = path.resolve(root, value);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const comparableRoot = process.platform === "win32" ? rootPrefix.toLowerCase() : rootPrefix;
  const comparablePath = process.platform === "win32" ? resolved.toLowerCase() : resolved;
  if (!comparablePath.startsWith(comparableRoot) || !fs.statSync(resolved, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Path must resolve to a file inside the repository: ${value}`);
  }
  return resolved;
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        reject(new Error("Request body exceeds 64 KiB"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/status/")) {
    let requestedRunId;
    try {
      requestedRunId = decodeURIComponent(url.pathname.slice("/status/".length));
    } catch {
      json(response, 400, { error: "Invalid runId encoding" });
      return;
    }
    const runId = safeRunId(requestedRunId);
    if (!runId) {
      json(response, 400, { error: "Invalid runId" });
      return;
    }
    const reportPath = path.join(runsRoot, runId, "flow-report.json");
    try {
      json(response, 200, JSON.parse(fs.readFileSync(reportPath, "utf8")));
    } catch (error) {
      if (error.code === "ENOENT") json(response, 404, { error: "Flow report not found" });
      else json(response, 500, { error: "Flow report cannot be read" });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/run") {
    try {
      const body = await readBody(request);
      const script = repoFile(body.script);
      const videoMap = repoFile(body.videoMap);
      const runId = safeRunId(body.runId ?? `flow-${Date.now()}`);
      if (!runId) throw new Error("runId contains unsupported characters");

      const runDir = path.join(runsRoot, runId);
      fs.mkdirSync(runDir, { recursive: true });
      const logFd = fs.openSync(path.join(runDir, "flow.log"), "a");
      const child = spawn(
        process.execPath,
        [path.join(root, "scripts", "run-flow.mjs"), "--script", script, "--video-map", videoMap, "--run-id", runId],
        {
          cwd: root,
          detached: true,
          stdio: ["ignore", logFd, logFd],
          windowsHide: true,
        },
      );
      child.on("error", (error) => {
        fs.appendFileSync(path.join(runDir, "flow.log"), `flow-server spawn error: ${error.message}\n`);
      });
      child.unref();
      fs.closeSync(logFd);
      json(response, 202, { runId });
    } catch (error) {
      json(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  json(response, 404, { error: "Not found" });
});

server.listen(port, host, () => {
  console.log(`Lucida flow server listening at http://${host}:${port}`);
});
