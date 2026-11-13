import assert from "node:assert/strict";
import test from "node:test";
import { formFromWizardOption, buildWizardOptionUpdatePayload } from "../src/data/wizardOptionPayload.js";
import { allowedCompatibilityFields } from "../src/data/wizardSetupLayout.js";
import { filterOptions, optionMatches, pruneSelections } from "../src/data/wizardSelection.js";
import { evaluateMappedSelections } from "../src/services/customBuildPayload.js";

const lists = {
  instrumentTypes: [
    { id: "electric-guitar", optionId: "instrument-type.electric-guitar", code: "electric-guitar", active: true },
    { id: "bass", optionId: "instrument-type.bass", code: "bass", active: true },
  ],
  series: [
    {
      id: "solid-body",
      optionId: "series.solid-body",
      code: "solid-body",
      active: true,
      instrumentTypeIds: ["electric-guitar"],
    },
    {
      id: "headless",
      optionId: "series.headless",
      code: "pq-boutique-series",
      active: true,
      instrumentTypeIds: ["electric-guitar"],
    },
  ],
  shapes: [
    {
      id: "compact-modern",
      optionId: "body-shape.compact-modern",
      code: "compact-modern",
      active: true,
      seriesIds: ["pq-boutique-series", "solid-body"],
      instrumentTypeIds: ["electric-guitar"],
    },
    {
      id: "double-cut",
      optionId: "body-shape.double-cut",
      code: "double-cut",
      active: true,
      seriesIds: ["solid-body"],
      instrumentTypeIds: ["electric-guitar"],
    },
  ],
  scales: [
    {
      id: "25.5",
      optionId: "scale.25-5",
      code: "25-5",
      active: true,
      shapeIds: ["compact-modern", "double-cut"],
      instrumentTypeIds: ["electric-guitar"],
      scaleIds: ["ignored"],
    },
    {
      id: "27",
      optionId: "scale.27",
      code: "27",
      active: true,
      shapeIds: ["double-cut"],
    },
  ],
  stringCounts: [
    {
      id: "6",
      optionId: "string-count.6",
      code: "6",
      value: 6,
      active: true,
      shapeIds: ["compact-modern", "double-cut"],
      scaleIds: ["25.5"],
    },
    {
      id: "7",
      optionId: "string-count.7",
      code: "7",
      value: 7,
      active: true,
      shapeIds: ["double-cut"],
      scaleIds: ["27"],
    },
  ],
  radii: [
    {
      id: "16",
      optionId: "radius.16",
      code: "16",
      active: true,
      shapeIds: ["compact-modern", "double-cut"],
      scaleIds: ["25.5"],
      stringCounts: [6],
    },
    {
      id: "compound-12-16",
      optionId: "radius.compound-12-16",
      code: "compound-12-16",
      active: true,
      shapeIds: ["double-cut"],
    },
  ],
};

function selected(shapeId, extra = {}) {
  return {
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId,
    scaleId: "25.5",
    stringCount: 6,
    radiusId: "16",
    ...extra,
  };
}

test("Test A — scale, strings, and radius stay cleared until a body shape is chosen, then load together", () => {
  const hidden = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    scaleId: "25.5",
    stringCount: 6,
    radiusId: "16",
  }, lists);
  assert.equal(hidden.shapeId ?? null, null);
  assert.equal(hidden.scaleId, null);
  assert.equal(hidden.stringCount, null);
  assert.equal(hidden.radiusId, null);

  const withShape = selected("compact-modern");
  assert.deepEqual(filterOptions(lists.scales, withShape, lists, "scale").map((item) => item.id), ["25.5"]);
  assert.deepEqual(filterOptions(lists.stringCounts, withShape, lists, "string-count").map((item) => item.id), ["6"]);
  assert.deepEqual(filterOptions(lists.radii, withShape, lists, "radius").map((item) => item.id), ["16"]);
});

test("Test B — changing one sibling selection does not filter or prune the others", () => {
  const start = selected("double-cut", { scaleId: "25.5", stringCount: 6, radiusId: "16" });
  const afterScale = pruneSelections({ ...start, scaleId: "27" }, lists);
  assert.equal(afterScale.scaleId, "27");
  assert.equal(afterScale.stringCount, 6);
  assert.equal(afterScale.radiusId, "16");

  const afterStrings = pruneSelections({ ...start, stringCount: 7 }, lists);
  assert.equal(afterStrings.scaleId, "25.5");
  assert.equal(afterStrings.stringCount, 7);
  assert.equal(afterStrings.radiusId, "16");

  const afterRadius = pruneSelections({ ...start, radiusId: "compound-12-16" }, lists);
  assert.equal(afterRadius.scaleId, "25.5");
  assert.equal(afterRadius.stringCount, 6);
  assert.equal(afterRadius.radiusId, "compound-12-16");
});

test("Test C — changing body shape reloads lists and clears only unavailable siblings", () => {
  const pruned = pruneSelections(selected("double-cut", {
    scaleId: "27",
    stringCount: 7,
    radiusId: "compound-12-16",
  }), lists);
  assert.equal(pruned.scaleId, "27");
  assert.equal(pruned.stringCount, 7);
  assert.equal(pruned.radiusId, "compound-12-16");

  const nextShape = pruneSelections({ ...pruned, shapeId: "compact-modern" }, lists);
  assert.equal(nextShape.shapeId, "compact-modern");
  assert.equal(nextShape.scaleId, "25.5");
  assert.equal(nextShape.stringCount, 6);
  assert.equal(nextShape.radiusId, "16");

  const keepScale = pruneSelections(selected("compact-modern", {
    scaleId: "25.5",
    stringCount: 7,
    radiusId: "16",
  }), lists);
  assert.equal(keepScale.scaleId, "25.5");
  assert.equal(keepScale.stringCount, 6);
  assert.equal(keepScale.radiusId, "16");
});

test("Test D — admin compatibility for the three groups is type, series, and body shape", () => {
  assert.deepEqual(
    allowedCompatibilityFields("scale").map((item) => item.key),
    ["instrumentTypeIds", "seriesIds", "shapeIds"],
  );
  assert.deepEqual(
    allowedCompatibilityFields("string-count").map((item) => item.key),
    ["instrumentTypeIds", "seriesIds", "shapeIds"],
  );
  assert.deepEqual(
    allowedCompatibilityFields("radius").map((item) => item.key),
    ["instrumentTypeIds", "seriesIds", "shapeIds"],
  );
  assert.equal(allowedCompatibilityFields("scale").some((item) => item.key === "stringCounts"), false);
  assert.equal(allowedCompatibilityFields("scale").some((item) => item.key === "scaleIds"), false);
  assert.deepEqual(
    allowedCompatibilityFields("body-shape").map((item) => item.key),
    ["instrumentTypeIds", "seriesIds"],
  );
  assert.deepEqual(allowedCompatibilityFields("series").map((item) => item.key), ["instrumentTypeIds"]);

  const scaleForm = formFromWizardOption({
    code: "25-5",
    name: "25.5",
    translations: { en: { name: "25.5" }, vi: { name: "25.5" } },
    compatibility: {
      instrumentTypeIds: ["electric-guitar"],
      seriesIds: ["pq-boutique-series"],
      shapeIds: ["compact-modern"],
      stringCounts: [6],
    },
  }, "scale", [
    { id: "instrument-type", options: [] },
    { id: "series", options: [] },
    { id: "body-shape", options: [] },
    { id: "scale", options: [] },
  ]);
  assert.deepEqual(scaleForm.compatibility.instrumentTypeIds, ["electric-guitar"]);
  assert.deepEqual(scaleForm.compatibility.seriesIds, ["pq-boutique-series"]);
  assert.deepEqual(scaleForm.compatibility.shapeIds, ["compact-modern"]);
  assert.equal(Object.hasOwn(scaleForm.compatibility, "stringCounts"), false);
  const scaleBody = buildWizardOptionUpdatePayload(scaleForm, {
    categories: [
      { id: "instrument-type", options: [] },
      { id: "series", options: [] },
      { id: "body-shape", options: [] },
      { id: "scale", options: [] },
    ],
  });
  assert.deepEqual(scaleBody.compatibility.instrumentTypeIds, ["electric-guitar"]);
  assert.deepEqual(scaleBody.compatibility.seriesIds, ["pq-boutique-series"]);
  assert.deepEqual(scaleBody.compatibility.shapeIds, ["compact-modern"]);
  assert.equal(Object.hasOwn(scaleBody.compatibility, "stringCounts"), false);
});

test("Test E — instrument type and series still gate body shape", () => {
  assert.equal(
    optionMatches(lists.shapes[0], { instrumentTypeId: "bass", seriesId: "solid-body" }, lists, "body-shape"),
    false,
  );
  assert.equal(
    optionMatches(lists.shapes[0], { instrumentTypeId: "electric-guitar", seriesId: "solid-body" }, lists, "body-shape"),
    true,
  );
  const player = filterOptions(
    lists.shapes,
    { instrumentTypeId: "electric-guitar", seriesId: "solid-body" },
    lists,
    "body-shape",
  );
  assert.deepEqual(player.map((item) => item.id), ["compact-modern", "double-cut"]);
  const boutique = filterOptions(
    lists.shapes,
    { instrumentTypeId: "electric-guitar", seriesId: "headless" },
    lists,
    "body-shape",
  );
  assert.deepEqual(boutique.map((item) => item.id), ["compact-modern"]);

  const pruned = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "headless",
    shapeId: "double-cut",
    scaleId: "25.5",
  }, lists);
  assert.equal(pruned.shapeId, null);

  const categories = [
    { id: "instrument-type", options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }] },
    { id: "series", options: [{ id: "series.headless", code: "pq-boutique-series", active: true }] },
    { id: "body-shape", options: [] },
  ];
  const form = formFromWizardOption({
    code: "compact-modern",
    name: "PRS",
    translations: { en: { name: "PRS" }, vi: { name: "PRS" } },
    compatibility: {
      instrumentTypeIds: ["electric-guitar", "bass"],
      seriesIds: ["pq-boutique-series", "pq-player-series-2"],
    },
  }, "body-shape", categories);
  assert.deepEqual(form.compatibility.instrumentTypeIds, ["electric-guitar", "bass"]);
  assert.deepEqual(form.compatibility.seriesIds, ["pq-boutique-series", "pq-player-series-2"]);
  const body = buildWizardOptionUpdatePayload(form, { categories });
  assert.deepEqual(body.compatibility.instrumentTypeIds, ["electric-guitar", "bass"]);
  assert.deepEqual(body.compatibility.seriesIds, ["pq-boutique-series", "pq-player-series-2"]);
  assert.equal(Object.hasOwn(body.compatibility, "shapeIds"), false);
});

test("Test F — inquiry mapping rejects a scale that is not available for the selected shape", () => {
  const catalog = {
    categories: [
      { id: "instrument-type", step: 1, required: true, selectionMode: "single", options: lists.instrumentTypes.map((item) => ({ ...item, id: item.optionId, active: true })) },
      { id: "series", step: 1, required: false, selectionMode: "single", options: [{ id: "series.solid-body", code: "solid-body", active: true }] },
      { id: "body-shape", step: 1, required: true, selectionMode: "single", options: [{ id: "body-shape.compact-modern", code: "compact-modern", active: true }] },
      {
        id: "scale",
        step: 1,
        required: false,
        selectionMode: "single",
        options: [
          { id: "scale.25-5", code: "25-5", active: true, compatibility: { shapeIds: ["compact-modern"] } },
          { id: "scale.27", code: "27", active: true, compatibility: { shapeIds: ["double-cut"] } },
        ],
      },
      {
        id: "string-count",
        step: 1,
        required: false,
        selectionMode: "single",
        options: [{ id: "string-count.6", code: "6", active: true, compatibility: { shapeIds: ["compact-modern"] } }],
      },
      {
        id: "radius",
        step: 1,
        required: false,
        selectionMode: "single",
        options: [{ id: "radius.16", code: "16", active: true, compatibility: { shapeIds: ["compact-modern"] } }],
      },
    ],
  };
  const ok = evaluateMappedSelections({
    "instrument-type": "instrument-type.electric-guitar",
    series: "series.solid-body",
    "body-shape": "body-shape.compact-modern",
    scale: "scale.25-5",
    "string-count": "string-count.6",
    radius: "radius.16",
  }, catalog);
  assert.deepEqual(ok, []);

  const rejected = evaluateMappedSelections({
    "instrument-type": "instrument-type.electric-guitar",
    series: "series.solid-body",
    "body-shape": "body-shape.compact-modern",
    scale: "scale.27",
    "string-count": "string-count.6",
    radius: "radius.16",
  }, catalog);
  assert.equal(rejected.some((issue) => issue.code === "INCOMPATIBLE_OPTION" && issue.field === "selections.scale"), true);
});

test("Test G — later groups ignore leftover scale and string-count rules", () => {
  assert.equal(allowedCompatibilityFields("body-wood").some((item) => item.key === "scaleIds"), false);
  assert.equal(allowedCompatibilityFields("body-wood").some((item) => item.key === "stringCounts"), false);
  assert.equal(allowedCompatibilityFields("pickup-config").some((item) => item.key === "scaleIds"), false);
  assert.equal(allowedCompatibilityFields("neck-wood").some((item) => item.key === "shapeIds"), true);
  for (const groupId of [
    "neck-construction",
    "neck-profile",
    "fret-spec",
    "pickup-config",
    "pickups",
    "electronics",
    "tuners",
    "hardware",
    "bridge",
    "finish-color",
    "finish-type",
    "inlay",
    "engraving",
  ]) {
    assert.deepEqual(
      allowedCompatibilityFields(groupId).map((item) => item.key),
      ["instrumentTypeIds", "seriesIds", "shapeIds"],
      groupId,
    );
  }

  const wood = {
    id: "alder",
    optionId: "body-wood.alder",
    code: "alder",
    active: true,
    instrumentTypeIds: ["electric-guitar"],
    shapeIds: ["compact-modern"],
    scaleIds: ["25.5"],
    stringCounts: [6],
  };
  const laterLists = {
    instrumentTypes: lists.instrumentTypes,
    series: lists.series,
    shapes: lists.shapes,
    scales: lists.scales,
    stringCounts: lists.stringCounts,
    radii: lists.radii,
    bodyWoods: [wood],
  };
  assert.equal(
    optionMatches(wood, selected("compact-modern", { scaleId: "27", stringCount: 7 }), laterLists, "body-wood"),
    true,
  );
  const kept = pruneSelections({
    ...selected("compact-modern"),
    bodyWoodId: "alder",
  }, laterLists);
  assert.equal(kept.bodyWoodId, "alder");
  assert.equal(kept.scaleId, "25.5");
  assert.equal(kept.stringCount, 6);
  assert.equal(kept.radiusId, "16");
});
