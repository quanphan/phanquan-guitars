import assert from "node:assert/strict";
import test from "node:test";
import {
  continuousConfigGroups,
  continuousConfigSections,
  firstIncompleteGroupKey,
  isConfiguredConfigGroup,
  isContinuousConfigStep,
  nextWizardStep,
  previousWizardStep,
  wizardSummarySections,
} from "../src/data/wizardContinuous.js";
import { applyLiveConfigSelection, buildLiveConfigGroups, liveSelectionKeepsGroupOpen } from "../src/data/wizardLiveConfig.js";
import { tFor } from "../src/i18n/translations.js";

test("continuous config skips step 1 groups and keeps later group order", () => {
  const t = (key) => tFor("en", key);
  const groups = continuousConfigGroups(buildLiveConfigGroups({
    selections: {
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      shapeId: "t-style",
      stringCount: 6,
      customerSuppliedParts: false,
    },
    instrumentType: { id: "electric-guitar", translations: { en: { name: "Electric Guitar" } } },
    series: { id: "solid-body", translations: { en: { name: "Solid" } } },
    shape: { id: "t-style", translations: { en: { name: "T-style" } } },
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
    availableBodyConstructions: [{ id: "single-piece", translations: { en: { name: "Single" } } }],
    availableBodyWoods: [{ id: "alder", translations: { en: { name: "Alder" } }, image: "/uploads/alder.png" }],
    availableTopWoods: [],
    availableScales: [],
    availableStringCounts: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    availablePickupConfigs: [],
    availablePickupTypes: [],
    availableBridges: [],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
    topApplicable: true,
    tunersApplicable: true,
    inheritedFretCount: 24,
  }, t, "en"));
  const keys = groups.map((item) => item.key);
  assert.equal(keys.includes("instrument"), false);
  assert.equal(keys.includes("series"), false);
  assert.equal(keys.includes("shape"), false);
  assert.equal(keys[0], "bodyPieces");
  assert.equal(keys.includes("bodyWood"), true);
  assert.equal(keys.includes("finishType"), false);
  const bodyWood = groups.find((item) => item.key === "bodyWood").items[0];
  assert.equal(bodyWood.image, "/uploads/alder.png");
  assert.equal(bodyWood.value, "alder");
  assert.equal(typeof bodyWood.value, "string");
});

test("live option values stay primitive ids even when extra is a plain object", () => {
  const t = (key) => tFor("en", key);
  const emptyLists = {
    availableBodyConstructions: [],
    availableTopWoods: [],
    availableScales: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    availablePickupConfigs: [],
    availablePickupTypes: [],
    availableBridges: [],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
  };
  const groups = buildLiveConfigGroups({
    ...emptyLists,
    selections: { bodyWoodId: "alder", stringCount: 6, customerSuppliedParts: false },
    availableBodyWoods: [
      { id: "alder", code: "alder", optionId: "body-wood.alder", translations: { en: { name: "Alder" } } },
      { id: "swamp-ash", code: "swamp-ash", optionId: "body-wood.swamp-ash", translations: { en: { name: "Swamp ash" } } },
    ],
    availableStringCounts: [{ id: "6", value: 6, translations: { en: { name: "6 strings" } } }],
  }, t, "en");
  const woods = groups.find((item) => item.key === "bodyWood").items;
  assert.equal(woods[0].value, "alder");
  assert.equal(woods[1].value, "swamp-ash");
  assert.equal(woods[0].selected, true);
  assert.equal(woods[1].selected, false);
  const strings = groups.find((item) => item.key === "strings").items;
  assert.equal(strings[0].value, 6);

  const calls = [];
  assert.equal(
    applyLiveConfigSelection({ selectBodyWood: (id) => calls.push(id) }, "bodyWoodId", woods[1].value),
    true,
  );
  assert.equal(
    applyLiveConfigSelection({ selectBodyWood: (id) => calls.push(id) }, "bodyWoodId", {}),
    false,
  );
  assert.equal(
    applyLiveConfigSelection({ selectBodyWood: (id) => calls.push(id) }, "bodyWoodId", ""),
    false,
  );
  assert.deepEqual(calls, ["swamp-ash"]);
});

test("Custom Scale keeps the scale group open; preset scales still collapse", () => {
  const scales = [
    { id: "25.5", code: "25.5", type: "single", display: "25.5″" },
    { id: "custom-scale", code: "custom-scale", type: "custom", optionId: "scale.custom-scale" },
  ];
  const builder = { availableScales: scales };
  assert.equal(liveSelectionKeepsGroupOpen("scaleId", "custom-scale", builder), true);
  assert.equal(liveSelectionKeepsGroupOpen("scaleId", "25.5", builder), false);
  assert.equal(liveSelectionKeepsGroupOpen("bodyWoodId", "alder", builder), false);
  assert.equal(liveSelectionKeepsGroupOpen("scaleId", "CUSTOM SCALE", { availableScales: [{ id: "25.5", name: "25\"" }] }), false);
});

test("summary sections keep wizard group order including step 1", () => {
  const t = (key) => tFor("en", key);
  const groups = buildLiveConfigGroups({
    selections: {
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      shapeId: "t-style",
      customerSuppliedParts: false,
    },
    instrumentType: { id: "electric-guitar", translations: { en: { name: "Electric Guitar" } } },
    series: { id: "solid-body", translations: { en: { name: "Solid" } } },
    shape: { id: "t-style", translations: { en: { name: "T-style" } } },
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
    availableBodyConstructions: [],
    availableBodyWoods: [],
    availableTopWoods: [],
    availableScales: [],
    availableStringCounts: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    availablePickupConfigs: [],
    availablePickupTypes: [],
    availableBridges: [],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
  }, t, "en");
  const sections = wizardSummarySections(groups, [
    { id: 1, key: "instrumentShape" },
    { id: 2, key: "bodyTop" },
  ]);
  assert.equal(sections[0].type, "heading");
  assert.equal(sections[0].step, 1);
  assert.equal(sections.find((item) => item.group?.key === "instrument")?.group.value, "Electric Guitar");
  assert.equal(tFor("en", "customBuild.summary.viewSummary"), "View summary");
  assert.equal(tFor("vi", "customBuild.summary.viewSummary"), "Xem tóm tắt");
});

test("wizard next and back skip per-step config after step 1", () => {
  assert.equal(isContinuousConfigStep(1), false);
  assert.equal(isContinuousConfigStep(4), true);
  assert.equal(nextWizardStep(1, { stepOneComplete: true }), 2);
  assert.equal(nextWizardStep(2, { configComplete: false }), 2);
  assert.equal(nextWizardStep(4, { configComplete: true }), 6);
  assert.equal(previousWizardStep(2), 1);
  assert.equal(previousWizardStep(5), 1);
  assert.equal(previousWizardStep(6), 5);
});

test("customer-supplied parts keeps electronics heading so the checkbox stays visible", () => {
  const t = (key) => tFor("en", key);
  const builder = {
    selections: { customerSuppliedParts: true, fretCount: 24 },
    availablePickupConfigs: [{ id: "hh", translations: { en: { name: "HH" } } }],
    availablePickupTypes: [],
    availableBridges: [],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [{ id: "gloss", translations: { en: { name: "Gloss" } } }],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
    availableBodyConstructions: [],
    availableBodyWoods: [],
    availableTopWoods: [],
    availableScales: [],
    availableStringCounts: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
    tunersApplicable: true,
  };
  const groups = continuousConfigGroups(buildLiveConfigGroups(builder, t, "en"));
  assert.equal(groups.some((item) => item.key === "pickupConfig"), false);
  assert.equal(groups.some((item) => item.key === "finishType"), true);
  const sections = continuousConfigSections(buildLiveConfigGroups(builder, t, "en"), [
    { id: 4, key: "electronicsHardware" },
    { id: 5, key: "finishDetails" },
  ]);
  assert.equal(sections.some((item) => item.type === "heading" && item.step === 4 && item.key === "electronicsHardware"), true);
});

test("your configuration hides groups that have no valid admin options", () => {
  const t = (key) => tFor("en", key);
  const groups = continuousConfigGroups(buildLiveConfigGroups({
    selections: { customerSuppliedParts: false },
    availableBodyConstructions: [],
    availableBodyWoods: [{ id: "alder", translations: { en: { name: "Alder" } } }],
    availableTopWoods: [{ id: "flame", translations: { en: { name: "Flame" } } }],
    availableScales: [],
    availableStringCounts: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [{ id: "maple", translations: { en: { name: "Maple" } } }],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    availablePickupConfigs: [],
    availablePickupTypes: [],
    availableBridges: [{ id: "tonepros", translations: { en: { name: "TonePros" } } }],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [{ id: "gloss", translations: { en: { name: "Gloss" } } }],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
    topApplicable: true,
    tunersApplicable: true,
  }, t, "en"));
  const keys = groups.map((item) => item.key);
  assert.equal(keys.includes("bodyPieces"), false);
  assert.equal(keys.includes("neckPieces"), false);
  assert.equal(keys.includes("scale"), false);
  assert.equal(keys.includes("tuners"), false);
  assert.equal(keys.includes("bodyWood"), true);
  assert.equal(keys.includes("topWood"), true);
  assert.equal(keys.includes("neckWood"), true);
  assert.equal(keys.includes("bridge"), true);
  assert.equal(keys.includes("finishType"), true);
  assert.equal(groups.find((item) => item.key === "bodyWood").filled, false);
  assert.equal(isConfiguredConfigGroup(groups.find((item) => item.key === "bodyWood")), true);

  const sections = continuousConfigSections(buildLiveConfigGroups({
    selections: { customerSuppliedParts: false },
    availableBodyWoods: [{ id: "alder", translations: { en: { name: "Alder" } } }],
    availableBodyConstructions: [],
    availableTopWoods: [],
    availableScales: [],
    availableStringCounts: [],
    availableRadii: [],
    availableNeckPieces: [],
    availableNeckWoods: [],
    availableNeckConstructions: [],
    availableFingerboardWoods: [],
    availableNeckProfiles: [],
    availableFretSpecs: [],
    availablePickupConfigs: [],
    availablePickupTypes: [],
    availableBridges: [],
    availableTuners: [],
    availableHardwareFinishes: [],
    availableControlLayouts: [],
    availableFinishTypes: [],
    availableFinishColors: [],
    availableInlays: [],
    availableEngravings: [],
    instrumentTypes: [],
    availableSeries: [],
    availableShapes: [],
  }, t, "en"), [
    { id: 2, key: "bodyTop" },
    { id: 3, key: "neckFingerboard" },
    { id: 4, key: "electronicsHardware" },
    { id: 5, key: "finishDetails" },
  ]);
  const headingSteps = sections.filter((item) => item.type === "heading").map((item) => item.step);
  assert.equal(headingSteps.includes(2), true);
  assert.equal(headingSteps.includes(3), true);
  assert.equal(headingSteps.includes(4), true);
  assert.equal(headingSteps.includes(5), true);
  assert.equal(sections.some((item) => item.group?.key === "bodyPieces"), false);
  assert.equal(sections.some((item) => item.group?.key === "fretCount"), true);
  assert.equal(sections.some((item) => item.group?.key === "customColor"), true);
});

test("first incomplete group maps missing fields to accordion keys", () => {
  assert.equal(
    firstIncompleteGroupKey({
      stepTwoMissing: [{ key: "bodyWoodId" }],
      stepThreeMissing: [],
      stepFourComplete: false,
      stepFiveComplete: false,
    }),
    "bodyWood",
  );
  assert.equal(
    firstIncompleteGroupKey({
      stepTwoMissing: [],
      stepThreeMissing: [],
      stepFourComplete: false,
      stepFiveComplete: false,
      selections: { customerSuppliedParts: false },
    }),
    "pickupConfig",
  );
});
