import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { WIZARD_SETUP_GROUPS } from "../src/data/wizardCatalog.js";
import { STEP_THREE_FIELDS } from "../src/data/wizardStepThree.js";

const root = dirname(fileURLToPath(import.meta.url));
const stepOne = readFileSync(join(root, "../src/components/custom-build/steps/StepInstrumentShape.jsx"), "utf8");
const stepThree = readFileSync(join(root, "../src/components/custom-build/steps/StepNeckFingerboard.jsx"), "utf8");

test("step 1 no longer renders scale, strings, or radius groups", () => {
  assert.equal(stepOne.includes("customBuild.step1.scaleLabel"), false);
  assert.equal(stepOne.includes("customBuild.step1.stringsLabel"), false);
  assert.equal(stepOne.includes("customBuild.step1.radiusLabel"), false);
  assert.equal(stepOne.includes("availableScales"), false);
  assert.equal(stepOne.includes("selectStringCount"), false);
});

test("step 3 renders scale, strings, then radius before neck woods", () => {
  const scaleAt = stepThree.indexOf("customBuild.step1.scaleLabel");
  const stringsAt = stepThree.indexOf("customBuild.step1.stringsLabel");
  const radiusAt = stepThree.indexOf("customBuild.step1.radiusLabel");
  const neckAt = stepThree.indexOf("customBuild.step3.neckWoodLabel");
  assert.equal(scaleAt > 0, true);
  assert.equal(stringsAt > scaleAt, true);
  assert.equal(radiusAt > stringsAt, true);
  assert.equal(neckAt > radiusAt, true);
  assert.match(stepThree, /id="scale-length"/);
  assert.match(stepThree, /id="string-count"/);
  assert.match(stepThree, /id="fretboard-radius"/);
});

test("scale, strings, and radius completeness belong to step 3, not step 1", () => {
  const groups = Object.fromEntries(WIZARD_SETUP_GROUPS.map((item) => [item.id, item.step]));
  assert.equal(groups.scale, 3);
  assert.equal(groups["string-count"], 3);
  assert.equal(groups.radius, 3);
  assert.equal(groups["body-shape"], 1);
  assert.deepEqual(
    STEP_THREE_FIELDS.slice(0, 3).map((item) => item.key),
    ["scaleId", "stringCount", "radiusId"],
  );
});
