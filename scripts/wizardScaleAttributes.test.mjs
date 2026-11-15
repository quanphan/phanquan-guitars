import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FRET_COUNT,
  emptyScaleForm,
  inquiryFretCount,
  isCustomScale,
  isValidCustomScaleValue,
  isValidFretCountSelection,
  MAX_CUSTOM_SCALE_INCHES,
  MAX_FRET_COUNT,
  MIN_CUSTOM_SCALE_INCHES,
  MIN_FRET_COUNT,
  parseCustomScaleInput,
  mergeScaleAttributes,
  normalizeFretCountSelection,
  shouldKeepCustomScaleValue,
  parsePositiveFretCount,
  scaleDisplayValue,
  scaleFormFromAttributes,
  validateScaleForm,
} from "../src/data/wizardScaleAttributes.js";
import { tFor } from "../src/i18n/translations.js";
import { buildInquiryPayload, evaluateWizardNotesSelections } from "../src/services/customBuildPayload.js";
import { buildInquiryDisplay } from "../src/services/inquiryDisplay.js";
import { filterOptions, optionMatches, pruneSelections } from "../src/data/wizardSelection.js";

test("fret count parsing accepts positive integers and rejects the rest", () => {
  assert.equal(parsePositiveFretCount(24), 24);
  assert.equal(parsePositiveFretCount("22"), 22);
  assert.equal(parsePositiveFretCount("27"), 27);
  assert.equal(parsePositiveFretCount("30"), 30);
  assert.equal(parsePositiveFretCount(0), null);
  assert.equal(parsePositiveFretCount(-1), null);
  assert.equal(parsePositiveFretCount("24.5"), null);
  assert.equal(parsePositiveFretCount(""), null);
  assert.equal(inquiryFretCount(undefined), DEFAULT_FRET_COUNT);
  assert.equal(inquiryFretCount(null), 24);
});

test("admin custom scale option does not store a workshop-entered length", () => {
  const preserved = mergeScaleAttributes(
    { wizardId: "25.5", type: "single", display: "25.5″" },
    { scaleType: "single", display: "25.5" },
  );
  assert.equal(preserved.wizardId, "25.5");
  assert.equal(preserved.type, "single");
  assert.equal(preserved.display, "25.5″");

  const custom = mergeScaleAttributes(
    { wizardId: "custom-scale", display: "26.5″" },
    { scaleType: "custom" },
  );
  assert.equal(custom.type, "custom");
  assert.equal(custom.display, undefined);
  assert.equal(isCustomScale(custom), true);
  assert.deepEqual(validateScaleForm({ ...emptyScaleForm("custom") }), {});
  assert.equal(isValidCustomScaleValue(""), false);
  assert.equal(isValidCustomScaleValue("   "), false);
  assert.equal(isValidCustomScaleValue('26.5"'), true);
  assert.equal(MIN_CUSTOM_SCALE_INCHES, 24);
  assert.equal(MAX_CUSTOM_SCALE_INCHES, 38);
  assert.equal(isCustomScale({ id: "custom-scale", name: "Custom Scale" }), true);
  assert.equal(shouldKeepCustomScaleValue(null, "custom-scale"), true);
  assert.equal(shouldKeepCustomScaleValue({ type: "single", display: "25.5″" }, "25.5"), false);
  assert.equal(isValidFretCountSelection(24), true);
  assert.equal(isValidFretCountSelection(""), false);
  assert.equal(MIN_FRET_COUNT, 20);
  assert.equal(MAX_FRET_COUNT, 26);
  assert.equal(isValidFretCountSelection(20), true);
  assert.equal(isValidFretCountSelection(26), true);
  assert.equal(isValidFretCountSelection(19), false);
  assert.equal(isValidFretCountSelection(27), false);
  assert.equal(isValidFretCountSelection("2"), false);
  assert.equal(normalizeFretCountSelection(""), "");
  assert.equal(normalizeFretCountSelection("22"), "22");
  assert.equal(normalizeFretCountSelection(null), DEFAULT_FRET_COUNT);
});

test("custom scale length accepts a single value or an ordered range between 24 and 38", () => {
  for (const value of ["24", "25", "25.5", '26.5"', "27", "38", "25-27", "25.5-27", "26.5-28", "24-38", "25.5 – 27"]) {
    assert.equal(isValidCustomScaleValue(value), true, value);
  }
  for (const value of ["23", "39", "-25", "0", "25-23", "25-39", "23-27", "25-25", "abc", "25-", "-27", "25.", "25 to 27"]) {
    assert.equal(isValidCustomScaleValue(value), false, value);
  }
  assert.equal(parseCustomScaleInput("25.5-27").ok, true);
  assert.deepEqual(parseCustomScaleInput("25.5-27").values, [25.5, 27]);
  assert.equal(parseCustomScaleInput("27-25").kind, "order");
  assert.equal(parseCustomScaleInput("23").kind, "bounds");
  assert.equal(parseCustomScaleInput("25-23").ok, false);

  const invalidNotes = evaluateWizardNotesSelections({
    scaleId: "custom-scale",
    customScaleValue: "23",
  }, { categories: [] });
  assert.equal(invalidNotes.some((item) => item.field === "selections.scale" && item.code === "INVALID"), true);
  const validNotes = evaluateWizardNotesSelections({
    scaleId: "custom-scale",
    customScaleValue: "25.5-27",
  }, { categories: [] });
  assert.equal(validNotes.some((item) => item.field === "selections.scale"), false);
  const presetNotes = evaluateWizardNotesSelections({
    scaleId: "25.5",
    customScaleValue: "23",
  }, { categories: [] });
  assert.equal(presetNotes.some((item) => item.field === "selections.scale"), false);
});

test("customer custom scale value is what the wizard displays", () => {
  const option = { type: "custom", name: "Custom Scale" };
  assert.equal(scaleDisplayValue(option), "");
  assert.equal(scaleDisplayValue(option, "26.5″ – 28″"), "26.5″ – 28″");
});

test("default fret count is 24 and customer values persist in inquiry notes", () => {
  assert.equal(DEFAULT_FRET_COUNT, 24);
  const payload = buildInquiryPayload({
    selections: {
      contactName: "Lan",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      contactCountry: "",
      scaleId: "custom-scale",
      customScaleValue: "26.5\" – 28\"",
      fretCount: 27,
    },
    language: "en",
    catalog: { categories: [] },
  });
  assert.match(payload.configuration.notes, /fretCount=27/);
  assert.match(payload.configuration.notes, /customScaleValue=26\.5" – 28"/);
  const leftover = buildInquiryPayload({
    selections: {
      contactName: "Lan",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      contactCountry: "",
      scaleId: "25.5",
      customScaleValue: "26.5\" – 28\"",
    },
    language: "en",
    catalog: { categories: [] },
  });
  assert.equal(leftover.configuration.notes.includes("customScaleValue="), false);
  const defaulted = buildInquiryPayload({
    selections: {
      contactName: "Lan",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      contactCountry: "",
      scaleId: "25.5",
    },
    language: "en",
    catalog: { categories: [] },
  });
  assert.match(defaulted.configuration.notes, /fretCount=24/);
});

test("existing inquiries without fret count display 24", () => {
  const display = buildInquiryDisplay(
    {
      customer: { name: "Lan", email: "lan@example.com" },
      configuration: {
        selections: {},
        notes: "wizard:\ninstrumentTypeId=electric-guitar\nscaleId=25.5",
      },
    },
    (key) => tFor("en", key),
  );
  const neck = display.groups.find((group) => group.id === "neck");
  const fret = neck.rows.find((row) => row.labelKey === "customBuild.summary.fretCount");
  assert.equal(fret.value, "24 frets");
});

test("stale scale series codes still show after series were renamed", () => {
  const lists = {
    series: [
      { id: "pq-player-series-2", optionId: "series.pq-player-series-2", code: "pq-player-series-2", active: true },
    ],
    scales: [
      {
        id: "25.5",
        optionId: "scale.25-5",
        code: "25-5",
        type: "single",
        display: "25.5″",
        seriesIds: ["solid-body", "headless"],
        instrumentTypeIds: ["electric-guitar"],
        shapeIds: ["double-cut"],
      },
    ],
    instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar", active: true }],
    shapes: [{ id: "double-cut", optionId: "body-shape.double-cut", code: "double-cut", active: true }],
  };
  const available = filterOptions(lists.scales, {
    instrumentTypeId: "electric-guitar",
    seriesId: "pq-player-series-2",
    shapeId: "double-cut",
  }, lists, "scale");
  assert.deepEqual(available.map((item) => item.id), ["25.5"]);
  assert.equal(optionMatches(lists.scales[0], {
    instrumentTypeId: "electric-guitar",
    seriesId: "pq-player-series-2",
    shapeId: "double-cut",
  }, lists, "scale"), true);
});

test("custom scale does not hide string counts bound to predefined scales", () => {
  const lists = {
    scales: [
      { id: "custom-scale", optionId: "scale.custom-scale", code: "custom-scale", type: "custom", name: "Custom Scale", active: true },
      { id: "25.5", optionId: "scale.25-5", code: "25.5", type: "single", active: true },
    ],
    stringCounts: [
      { id: "6", optionId: "string-count.6", code: "6", value: 6, scaleIds: ["25.5", "27"], active: true },
    ],
  };
  const available = filterOptions(lists.stringCounts, { scaleId: "custom-scale" }, lists, "string-count");
  assert.deepEqual(available.map((item) => item.id), ["6"]);
  const predefined = filterOptions(lists.stringCounts, { scaleId: "25.5" }, lists, "string-count");
  assert.deepEqual(predefined.map((item) => item.id), ["6"]);
});

test("admin custom scale copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.wizardSetup.scaleTypes.custom"), "Custom Scale");
  assert.equal(tFor("vi", "admin.wizardSetup.customScaleCustomerHelp").includes("Khách"), true);
  assert.equal(tFor("en", "customBuild.step1.customScaleInputLabel"), "Your scale length");
  assert.equal(tFor("en", "customBuild.step1.customScaleError").includes("24 and 38"), true);
  assert.equal(tFor("vi", "customBuild.step1.customScaleError").includes("24 đến 38"), true);
  assert.equal(tFor("en", "customBuild.step3.fretCountInputHelp").includes("20"), true);
  assert.equal(tFor("en", "customBuild.step3.fretCountInputHelp").includes("26"), true);
  assert.equal(tFor("en", "customBuild.step3.fretCountError").includes("20"), true);
  assert.equal(tFor("en", "customBuild.step3.fretCountLabel"), "Number of frets");
  assert.equal(tFor("vi", "customBuild.step3.fretCountLabel"), "Số fret");
});

test("loaded custom scale type stays custom without requiring a stored length", () => {
  const loaded = scaleFormFromAttributes({ type: "custom" });
  assert.equal(loaded.scaleType, "custom");
  const pruned = pruneSelections({
    instrumentTypeId: "electric-guitar",
    scaleId: "25.5",
    fretCount: 30,
  }, {
    instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar", active: true }],
    scales: [{ id: "25.5", optionId: "scale.25-5", code: "25.5", type: "single", active: true }],
  });
  assert.equal(pruned.fretCount, 30);
});
