import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBodyNeck,
  formatScaleDisplay,
  formatStringsAndScale,
  guitarCardSummary,
} from "../src/services/guitarCardSummary.js";

const t = (key) =>
  ({
    "guitars.cardSummary.stringsValue": "{count} strings",
    "guitars.cardSummary.stringsScale": "Strings / Scale",
    "guitars.cardSummary.bodyNeck": "Body / Neck",
    "guitars.cardSummary.finishType": "Finish type",
  })[key] || key;

test("single scale stays a single value without Multiscale", () => {
  assert.equal(formatScaleDisplay('25.5"', ""), '25.5"');
  assert.equal(formatStringsAndScale({ stringCount: "7", scaleLength: '25.5"' }, t), '7 strings · 25.5"');
});

test("two different scales add Multiscale", () => {
  assert.equal(formatScaleDisplay("", '25.5"–26.5"'), '25.5"–26.5" Multiscale');
  assert.equal(
    formatStringsAndScale({ stringCount: "6", scaleLength: '25.5"', multiscaleRange: '25.5"–26.5"' }, t),
    '6 strings · 25.5"–26.5" Multiscale',
  );
});

test("does not invent Multiscale from a single leftover range value", () => {
  assert.equal(formatScaleDisplay("", '25.5"'), '25.5"');
});

test("card summary hides missing, zero, and undefined spec values", () => {
  const rows = guitarCardSummary(
    {
      specTabs: {
        neck: { stringCount: "0", scaleLength: "undefined" },
        body: { bodyWood: "", neckWood: null },
        finish: { finishType: "   " },
      },
    },
    t,
  );
  assert.deepEqual(rows, []);
});

test("body/neck uses only woods that exist", () => {
  assert.equal(formatBodyNeck({ bodyWood: "Mahogany", neckWood: "Maple" }), "Mahogany / Maple");
  assert.equal(formatBodyNeck({ bodyWood: "Mahogany" }), "Mahogany");
  assert.equal(formatBodyNeck({}), "");
});

test("collection cards show strings/scale, body/neck, finish and omit pickup", () => {
  const bass = guitarCardSummary(
    {
      specTabs: {
        body: { bodyWood: "Alder" },
        neck: { neckWood: "Roasted maple", scaleLength: '34"', stringCount: "5" },
        electronicsHardware: { pickupConfiguration: "HH" },
        finish: { finishType: "Conversion varnish" },
      },
    },
    t,
  );
  assert.deepEqual(
    bass.map((row) => row.id),
    ["stringsScale", "bodyNeck", "finishType"],
  );
  assert.equal(bass[0].value, '5 strings · 34"');
  assert.equal(bass[1].value, "Alder / Roasted maple");
  assert.equal(bass[2].value, "Conversion varnish");
  assert.equal(bass.some((row) => /pickup/i.test(row.value)), false);

  const exotic = guitarCardSummary(
    {
      specTabs: {
        neck: { scaleLength: '25.5"', multiscaleRange: '25"–25.5"', stringCount: "6" },
        body: { bodyWood: "Mahogany", neckWood: "Maple" },
        electronicsHardware: { pickupConfiguration: "HH" },
      },
    },
    t,
  );
  assert.match(exotic[0].value, /6 strings/);
  assert.match(exotic[0].value, /Multiscale/);
  assert.equal(exotic.some((row) => row.id === "pickupConfiguration"), false);
});
