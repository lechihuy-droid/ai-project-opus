import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const loadTypeScriptModule = (relativePath) => {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  Function("exports", "module", output)(module.exports, module);
  return module.exports;
};

const {
  applyElementTransition,
  interpolateEnvironmentTransform,
  normalizeEnvironmentTransform,
} = loadTypeScriptModule(
  "src/mechanism/continuousState.ts",
);
const { splitSubtitleLines } = loadTypeScriptModule("src/subtitleLines.ts");

test("continuous renderer keeps one environment and dispatches C1 components", () => {
  const source = fs.readFileSync(
    path.join(root, "src/mechanism/ContinuousEnvironment.tsx"),
    "utf8",
  );
  assert.match(source, /<MechanismWindow\b/u);
  assert.match(source, /case "ContextChip"/u);
  assert.match(source, /case "TimerMorph"/u);
  assert.match(source, /case "DiffHighlight"/u);
  assert.match(source, /case "MechanismWindow"/u);
  assert.match(source, /activeWindowTarget === element\.target/u);
  assert.match(source, /index <= sceneIndex/u);
});

test("environment position and scale animate over 20 frames", () => {
  const from = normalizeEnvironmentTransform({});
  const to = normalizeEnvironmentTransform({
    position: { left: 280, top: 450 },
    scale: 0.8,
  });

  assert.deepEqual(
    interpolateEnvironmentTransform(from, to, 90, 90),
    from,
  );
  assert.deepEqual(interpolateEnvironmentTransform(from, to, 100, 90), {
    position: { left: 180, top: 350 },
    scale: 0.9,
  });
  assert.deepEqual(interpolateEnvironmentTransform(from, to, 110, 90), to);
});

test("legacy environment maps keep the original transform defaults", () => {
  assert.deepEqual(normalizeEnvironmentTransform({}), {
    position: { left: 80, top: 250 },
    scale: 1,
  });
});

test("composition branches on continuous mode and reuses SubtitleBar", () => {
  const source = fs.readFileSync(
    path.join(root, "src/Composition.tsx"),
    "utf8",
  );
  assert.match(source, /videoMap\.mode === "continuous"/u);
  assert.match(source, /<ContinuousEnvironment\b/u);
  assert.match(source, /<SubtitleBar\b/u);
});

test("an 11-word caption is split into at most two balanced lines", () => {
  const words = "one two three four five six seven eight nine ten eleven".split(
    " ",
  );
  const lines = splitSubtitleLines(words);

  assert.deepEqual(
    lines.map((line) => line.length),
    [6, 5],
  );
  assert.deepEqual(lines.flat(), words);
});

test("remove transitions delete the element identified by target", () => {
  const elements = new Map();
  applyElementTransition(
    elements,
    {
      target: "recipient-chip",
      action: "add",
      props: {
        component: "ContextChip",
        label: "Recipient",
        value: "Japanese client",
        target: { x: 0.5, y: 0.58 },
      },
    },
    90,
  );
  applyElementTransition(
    elements,
    { target: "recipient-chip", action: "remove", props: {} },
    180,
  );

  assert.equal(elements.has("recipient-chip"), false);
});

test("legacy add and update transition behavior is unchanged", () => {
  const elements = new Map();
  applyElementTransition(
    elements,
    {
      target: "timer",
      action: "add",
      props: { component: "TimerMorph", from: "30:00", to: "05:00" },
    },
    30,
  );
  applyElementTransition(
    elements,
    {
      target: "timer",
      action: "update",
      props: { label: "SAVED" },
    },
    60,
  );

  assert.deepEqual(elements.get("timer"), {
    target: "timer",
    props: {
      component: "TimerMorph",
      from: "30:00",
      to: "05:00",
      label: "SAVED",
    },
    startFrame: 60,
  });
});

test("chips in one scene use their individual offsetSec start frames", () => {
  const elements = new Map();
  const chipProps = {
    component: "ContextChip",
    label: "Context",
    value: "Value",
    target: { x: 0.5, y: 0.5 },
  };

  applyElementTransition(
    elements,
    { target: "chip-now", action: "add", props: chipProps, offsetSec: 0 },
    90,
    30,
    150,
  );
  applyElementTransition(
    elements,
    { target: "chip-later", action: "add", props: chipProps, offsetSec: 2 },
    90,
    30,
    150,
  );

  assert.equal(elements.get("chip-now").startFrame, 90);
  assert.equal(elements.get("chip-later").startFrame, 150);
});

test("remove with offsetSec keeps an element visible until its effective frame", () => {
  const elements = new Map();
  applyElementTransition(
    elements,
    {
      target: "recipient-chip",
      action: "add",
      props: {
        component: "ContextChip",
        label: "Recipient",
        value: "Japanese client",
        target: { x: 0.5, y: 0.58 },
      },
    },
    0,
    30,
    0,
  );
  const delayedRemove = {
    target: "recipient-chip",
    action: "remove",
    props: {},
    offsetSec: 2,
  };

  applyElementTransition(elements, delayedRemove, 90, 30, 149);
  assert.equal(elements.has("recipient-chip"), true);

  applyElementTransition(elements, delayedRemove, 90, 30, 150);
  assert.equal(elements.has("recipient-chip"), false);
});

test("transitions without offsetSec keep scene-start timing", () => {
  const elements = new Map();
  applyElementTransition(
    elements,
    {
      target: "legacy-chip",
      action: "add",
      props: {
        component: "ContextChip",
        label: "Legacy",
        value: "No offset",
        target: { x: 0.5, y: 0.5 },
      },
    },
    120,
    30,
    120,
  );

  assert.equal(elements.get("legacy-chip").startFrame, 120);
});
