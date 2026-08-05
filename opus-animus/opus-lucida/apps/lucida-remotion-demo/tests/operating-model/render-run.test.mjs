import assert from "node:assert/strict";
import test from "node:test";
import { buildRemotionInvocation } from "../../scripts/render-run.mjs";

test("render invocation preserves a Windows browser path containing spaces", () => {
  const browserExecutable = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const invocation = buildRemotionInvocation({
    appRoot: "C:\\lucida-remotion-demo",
    output: "C:\\lucida-remotion-demo\\output\\video.mp4",
    browserExecutable,
  });

  assert.equal(invocation.command, process.execPath);
  assert.equal(
    invocation.args.at(-1),
    "--browser-executable=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  );
});
