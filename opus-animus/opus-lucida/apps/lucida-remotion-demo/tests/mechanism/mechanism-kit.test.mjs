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
const mechanismRoot = path.join(root, "src/mechanism");

const readMechanism = (name) =>
  fs.readFileSync(path.join(mechanismRoot, name), "utf8");

const readObjectLiteral = (fileName, exportName) => {
  const sourceText = readMechanism(fileName);
  const source = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let object;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === exportName
    ) {
      const call = node.initializer;
      object = ts.isCallExpression(call) ? call.arguments[0] : call;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(
    object && ts.isObjectLiteralExpression(object),
    `${exportName} must be an object literal`,
  );
  const readValue = (rawNode) => {
    const valueNode = ts.isAsExpression(rawNode) ? rawNode.expression : rawNode;
    if (ts.isStringLiteral(valueNode)) return valueNode.text;
    if (valueNode.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (valueNode.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isObjectLiteralExpression(valueNode)) {
      return Object.fromEntries(
        valueNode.properties.map((property) => {
          assert.ok(ts.isPropertyAssignment(property));
          return [
            property.name.getText(source),
            readValue(property.initializer),
          ];
        }),
      );
    }
    return Number(valueNode.getText(source));
  };
  return Object.fromEntries(
    object.properties.map((property) => {
      assert.ok(ts.isPropertyAssignment(property));
      const key = property.name.getText(source);
      return [key, readValue(property.initializer)];
    }),
  );
};

test("mechanism props are semantic closed contracts", () => {
  const contracts = [
    [
      "MechanismWindow.tsx",
      ["variant", "title", "japaneseText", "vietnameseText", "state"],
    ],
    ["ContextChip.tsx", ["label", "value", "target", "from"]],
    ["TimerMorph.tsx", ["from", "to", "label", "position"]],
    ["DiffHighlight.tsx", ["before", "after", "beforeLabel", "afterLabel"]],
  ];

  for (const [fileName, expectedProps] of contracts) {
    const source = readMechanism(fileName);
    for (const prop of expectedProps) {
      assert.match(
        source,
        new RegExp(`\\b${prop}\\??:`),
        `${fileName} must type ${prop}`,
      );
    }
    assert.doesNotMatch(
      source,
      /\b(?:style|className|children|dangerouslySetInnerHTML)\??\s*:/u,
    );
  }

  assert.match(
    readMechanism("MechanismWindow.tsx"),
    /"email" \| "chat" \| "doc"/u,
  );
  assert.match(readMechanism("MechanismWindow.tsx"), /"draft" \| "sent"/u);
  assert.match(readMechanism("DiffHighlight.tsx"), /"error" \| "correction"/u);
});

test("component defaults stay deterministic", () => {
  assert.deepEqual(
    readObjectLiteral("MechanismWindow.tsx", "MECHANISM_WINDOW_DEFAULTS"),
    {
      state: "draft",
      showCursor: true,
      cursorBlinkFrames: 16,
    },
  );
  assert.deepEqual(
    readObjectLiteral("TimerMorph.tsx", "TIMER_MORPH_DEFAULTS"),
    {
      label: "TIME SAVED",
      position: { left: 115, top: 1020 },
      startFrame: 0,
      durationInFrames: 42,
    },
  );
  assert.deepEqual(
    readObjectLiteral("ContextChip.tsx", "CONTEXT_CHIP_DEFAULTS"),
    {
      from: { x: 0.14, y: 0.72 },
      startFrame: 0,
      durationInFrames: 30,
    },
  );
  assert.deepEqual(
    readObjectLiteral("DiffHighlight.tsx", "DIFF_HIGHLIGHT_DEFAULTS"),
    {
      beforeLabel: "BEFORE",
      afterLabel: "AFTER",
      revealStartFrame: 12,
      revealDurationInFrames: 24,
    },
  );
});

test("Noto Sans JP and sequential demo composition are wired", () => {
  const font = readMechanism("font.ts");
  assert.match(font, /@remotion\/google-fonts\/NotoSansJP/u);
  assert.match(font, /"japanese"/u);
  assert.match(font, /"vietnamese"/u);

  const rootSource = fs.readFileSync(path.join(root, "src/Root.tsx"), "utf8");
  const demo = readMechanism("MechanismKitDemo.tsx");
  assert.match(rootSource, /id="MechanismKitDemo"/u);
  assert.match(demo, /MECHANISM_DEMO_BLOCK_FRAMES \* 4/u);
  for (const component of [
    "MechanismWindow",
    "ContextChip",
    "TimerMorph",
    "DiffHighlight",
  ]) {
    assert.match(demo, new RegExp(`<${component}\\b`));
  }
});
