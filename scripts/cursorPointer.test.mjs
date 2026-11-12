import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "../src/index.css"), "utf8");
const button = readFileSync(join(root, "../src/components/Button.jsx"), "utf8");

test("interactive controls get pointer at the shared base layer", () => {
  assert.match(css, /@layer base/);
  assert.match(css, /a\[href\]/);
  assert.match(css, /button:not\(:disabled\)/);
  assert.match(css, /\[role="tab"\]/);
  assert.match(css, /\[role="radio"\]/);
  assert.match(css, /cursor: pointer/);
  assert.match(css, /:disabled[\s\S]*cursor: not-allowed/);
  assert.match(css, /textarea[\s\S]*cursor: auto/);
});

test("shared Button uses pointer when enabled and not-allowed when disabled", () => {
  assert.match(button, /disabled \? "cursor-not-allowed/);
  assert.match(button, /: "cursor-pointer"/);
});
