import assert from "node:assert/strict";
import test from "node:test";
import { choiceSwatchColor, choiceSwatchCss } from "../src/data/choiceSwatch.js";

test("choice swatch prefers catalog hex and infers paint from the option name", () => {
  assert.equal(choiceSwatchColor({ swatch: "#8b5a2b", name: "Black" }), "#8b5a2b");
  assert.equal(choiceSwatchColor({ id: "black", label: "Black" }), "#171717");
  assert.equal(choiceSwatchColor({ label: "Vintage" }), "#e8dcc8");
  assert.equal(choiceSwatchColor({ label: "Natural wood" }), "#8b5a2b");
  assert.equal(choiceSwatchColor({ label: "Trao đổi thêm" }), "");
  assert.ok(choiceSwatchCss({ label: "Trao đổi thêm" }).backgroundImage.includes("conic-gradient"));
  assert.ok(choiceSwatchCss({ label: "Transparent" }).backgroundImage.includes("linear-gradient"));
  assert.ok(choiceSwatchCss({ label: "Metallic" }).backgroundImage.includes("linear-gradient"));
  assert.equal(choiceSwatchColor({ label: "Solid" }), "#5a5a5a");
  assert.equal(choiceSwatchCss({ label: "Bolt-on" }), null);
});
