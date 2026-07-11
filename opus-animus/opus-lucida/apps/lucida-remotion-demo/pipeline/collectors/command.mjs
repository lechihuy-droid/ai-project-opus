import path from "node:path";
import { spawn } from "node:child_process";
import { makeProvenance, resolveInside, sha256 } from "./shared.mjs";

const VERSION = "command-collector/1";

export const collectCommand = ({ source, projectRoot, allowedCommands }) =>
  new Promise((resolve, reject) => {
    if (!source.command)
      return reject(new Error(`Command source ${source.id} requires command`));
    if (!allowedCommands.has(source.command))
      return reject(new Error(`Command is not allowlisted: ${source.command}`));

    const cwd = resolveInside(projectRoot, source.workingDirectory ?? ".");
    const args = source.args ?? [];
    const startedAt = new Date().toISOString();
    const chunks = [];
    const child = spawn(source.command, args, {
      cwd,
      shell: false,
      windowsHide: true,
      env: {
        PATH: process.env.PATH,
        Path: process.env.Path,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
      },
    });

    const timeoutMs = Math.max(1, source.timeoutSeconds ?? 60) * 1000;
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (data) =>
      chunks.push({ stream: "stdout", text: data.toString() }),
    );
    child.stderr.on("data", (data) =>
      chunks.push({ stream: "stderr", text: data.toString() }),
    );
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      const endedAt = new Date().toISOString();
      const serialized = JSON.stringify({
        command: source.command,
        args,
        chunks,
        exitCode,
        signal,
      });
      const checksum = sha256(serialized);
      const sourceRef = `command:${source.command} ${args.join(" ")}`.trim();
      resolve({
        sourceId: source.id,
        sourceType: source.type,
        collectorVersion: VERSION,
        checksum,
        metadata: {
          command: source.command,
          args,
          cwd: path.relative(projectRoot, cwd) || ".",
          startedAt,
          endedAt,
          exitCode,
          signal,
        },
        records: chunks.map((chunk, index) => ({
          kind: chunk.stream,
          index,
          text: chunk.text,
          provenance: makeProvenance({
            source,
            sourceRef: `${sourceRef}#chunk-${index + 1}`,
            checksum,
            version: VERSION,
          }),
        })),
      });
    });
  });
