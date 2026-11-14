import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLineArtInteriorMask,
  fillPreviewFromImageData,
  guitarPreviewLayerSrcs,
  isLinePixel,
  previewCanvasSrc,
  resolveGuitarPreview,
} from "../src/data/wizardGuitarPreview.js";
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

test("preview canvas sources stay on /uploads so WebGL-free 2d fill is not CORS-tainted", () => {
  assert.equal(
    previewCanvasSrc("https://timbowebapi.up.railway.app/uploads/categories/maple.png"),
    "/uploads/categories/maple.png",
  );
  assert.equal(previewCanvasSrc("/uploads/categories/maple.png"), "/uploads/categories/maple.png");
});

test("none top wood is not used as a fill layer", () => {
  const preview = resolveGuitarPreview({
    shape: { image: "/uploads/shape.jpg" },
    bodyWood: { image: "/uploads/alder.jpg" },
    topWood: { id: "none", kind: "none", image: "/uploads/should-ignore.jpg" },
  });
  assert.equal(preview.layers.topWoodImage, null);
  assert.equal(preview.layers.bodyWoodImage, "/uploads/alder.jpg");
  const srcs = guitarPreviewLayerSrcs(preview, (path) => path);
  assert.equal(srcs.fillWood, "/uploads/alder.jpg");
});

function goldRectDrawing(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const onBorder = x >= 8 && x <= 31 && y >= 6 && y <= 33 && (x <= 10 || x >= 29 || y <= 8 || y >= 31);
      if (onBorder) {
        data[i] = 196;
        data[i + 1] = 148;
        data[i + 2] = 48;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
      data[i + 3] = 255;
    }
  }
  return data;
}

test("line-art interior mask fills white body and keeps gold outline", () => {
  const width = 40;
  const height = 40;
  const drawing = goldRectDrawing(width, height);
  const interior = buildLineArtInteriorMask(drawing, width, height);
  assert.equal(interior.ok, true);
  assert.equal(interior.line[8 * width + 8], 1);
  assert.equal(interior.mask[0], 0);
  assert.equal(interior.mask[20 * width + 20], 1);
});

test("pale cream body fill is not treated as a gold outline", () => {
  assert.equal(isLinePixel(196, 148, 48), true);
  assert.equal(isLinePixel(234, 223, 198), false);
});

test("wood and finish color apply inside the drawing and leave the background", () => {
  const width = 40;
  const height = 40;
  const drawing = goldRectDrawing(width, height);
  const wood = new Uint8ClampedArray(drawing.length);
  for (let i = 0; i < wood.length; i += 4) {
    wood[i] = 180;
    wood[i + 1] = 120;
    wood[i + 2] = 70;
    wood[i + 3] = 255;
  }
  const filled = fillPreviewFromImageData(drawing, wood, "#8b5a2b", width, height);
  assert.equal(filled.usedInteriorMask, true);
  const corner = [filled.data[0], filled.data[1], filled.data[2]];
  assert.deepEqual(corner, [255, 255, 255]);
  const line = (8 * width + 8) * 4;
  assert.equal(filled.data[line], 196);
  const center = (20 * width + 20) * 4;
  assert.notEqual(filled.data[center], 255);
  assert.ok(filled.data[center] > 40);
  assert.ok(filled.data[center + 2] < filled.data[center]);
});

test("named finish and wood tones fill when admin has no hex or photo", () => {
  const preview = resolveGuitarPreview({
    shape: { image: "/uploads/shape.jpg" },
    bodyWood: { id: "mahogany", code: "mahogany" },
    topWood: { id: "none", kind: "none" },
    finishColor: { id: "finish-color.black", code: "black" },
  });
  assert.equal(preview.layers.woodTone, "#703c28");
  assert.equal(preview.layers.finishSwatch, "#1a1a1a");
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
