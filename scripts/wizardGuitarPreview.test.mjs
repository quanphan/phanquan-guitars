import assert from "node:assert/strict";
import test from "node:test";
import { resolveGuitarPreview } from "../src/data/wizardGuitarPreview.js";
import { buildLiveConfigGroups } from "../src/data/wizardLiveConfig.js";
import { pickConfiguredOption } from "../src/data/wizardDefaults.js";
import { tFor } from "../src/i18n/translations.js";

test("guitar preview prefers body shape image, then series, then instrument type", () => {
  const preview = resolveGuitarPreview({
    instrumentType: { image: "/uploads/type.jpg", name: "Electric" },
    series: { image: "/uploads/series.jpg", name: "Compton" },
    shape: { image: "/uploads/shape.jpg", name: "Double cut" },
    bodyWood: { image: "/uploads/swamp-ash.png", name: "Swamp ash" },
    topWood: { image: "/uploads/flame.png", name: "Flamed maple" },
    finishColor: { swatch: "#8b5a2b", name: "Natural" },
  });
  assert.equal(preview.image, "/uploads/shape.jpg");
  assert.equal(preview.source, "shape");
  assert.equal(preview.layers.topWoodImage, "/uploads/flame.png");
  assert.equal(preview.layers.bodyWoodImage, "/uploads/swamp-ash.png");
  assert.equal(preview.layers.finishSwatch, "#8b5a2b");

  const seriesOnly = resolveGuitarPreview({
    instrumentType: { image: "/uploads/type.jpg" },
    series: { image: "/uploads/series.jpg" },
    shape: { image: "" },
  });
  assert.equal(seriesOnly.source, "series");

  const none = resolveGuitarPreview({
    instrumentType: { name: "Electric" },
    series: {},
    shape: null,
    bodyWood: { image: "/uploads/swamp-ash.png" },
  });
  assert.equal(none, null);
});

test("guitar preview back image is ranked independently and never uses the front photo", () => {
  const withBack = resolveGuitarPreview({
    instrumentType: { image: "/uploads/type.jpg", imageBack: "/uploads/type-back.jpg" },
    series: { image: "/uploads/series.jpg" },
    shape: { image: "/uploads/shape.jpg", attributes: { imageBack: "/uploads/shape-back.jpg" } },
  });
  assert.equal(withBack.image, "/uploads/shape.jpg");
  assert.equal(withBack.imageBack, "/uploads/shape-back.jpg");
  assert.equal(withBack.backSource, "shape");
  assert.notEqual(withBack.imageBack, withBack.image);

  const noBack = resolveGuitarPreview({
    shape: { image: "/uploads/shape.jpg", name: "Double cut" },
    series: { image: "/uploads/series.jpg" },
  });
  assert.equal(noBack.image, "/uploads/shape.jpg");
  assert.equal(noBack.imageBack, null);

  const seriesBack = resolveGuitarPreview({
    instrumentType: { image: "/uploads/type.jpg", backImage: "/uploads/type-back.jpg" },
    series: { image: "/uploads/series.jpg", imageBack: "/uploads/series-back.jpg" },
    shape: { image: "/uploads/shape.jpg" },
  });
  assert.equal(seriesBack.image, "/uploads/shape.jpg");
  assert.equal(seriesBack.imageBack, "/uploads/series-back.jpg");
  assert.equal(seriesBack.backSource, "series");
});

test("finish swatch is ignored unless it is a hex color", () => {
  const preview = resolveGuitarPreview({
    shape: { image: "/uploads/shape.jpg", name: "Double cut" },
    finishColor: { swatch: "black" },
  });
  assert.equal(preview.layers.finishSwatch, null);
});

test("configured option prefers admin default over the first compatible row", () => {
  const options = [
    { id: "alder", active: true },
    { id: "mahogany", active: true, isDefault: true, defaultForInstrumentTypeIds: ["electric-guitar"] },
  ];
  assert.equal(pickConfiguredOption(options, "electric-guitar").id, "mahogany");
  assert.equal(pickConfiguredOption(options, "bass").id, "mahogany");
  assert.equal(
    pickConfiguredOption(
      [{ id: "alder", active: true }, { id: "swamp-ash", active: true }],
      "bass",
    ).id,
    "alder",
  );
});

test("live configuration lists step 2+ groups even when a value is empty", () => {
  const t = (key) => tFor("en", key);
  const groups = buildLiveConfigGroups({
    selections: {
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      shapeId: "t-style",
      stringCount: null,
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
    topApplicable: true,
    tunersApplicable: true,
    inheritedFretCount: 24,
  }, t, "en");
  const keys = groups.map((item) => item.key);
  assert.equal(keys.includes("instrument"), true);
  assert.equal(keys.includes("scale"), true);
  assert.equal(keys.includes("strings"), true);
  assert.equal(keys.includes("radius"), true);
  assert.equal(keys.includes("bodyWood"), true);
  assert.equal(keys.includes("pickupConfig"), true);
  const strings = groups.find((item) => item.key === "strings");
  assert.equal(strings.filled, false);
  assert.equal(strings.value, t("customBuild.summary.empty"));
});
