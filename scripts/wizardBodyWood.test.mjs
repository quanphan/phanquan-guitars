import assert from "node:assert/strict";
import test from "node:test";
import { pruneSelections } from "../src/data/wizardSelection.js";
import {
  findSeriesConstructionOption,
  parseConstructionPieceCount,
  seriesBodyConstructionOptions,
  usesSecondaryBodyWood,
} from "../src/data/wizardSeriesConstruction.js";
import { buildInquiryPayload, evaluateWizardNotesSelections } from "../src/services/customBuildPayload.js";
import { buildInquiryDisplay, parseInquiryNotes } from "../src/services/inquiryDisplay.js";
import { tFor } from "../src/i18n/translations.js";
import { collectStepTwoMissing } from "../src/data/wizardStepTwo.js";

const lists = {
  instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", active: true }],
  series: [{
    id: "solid-body",
    optionId: "series.solid-body",
    bodyConstruction: [
      { id: "1-piece", name: "1 Piece", active: true, sortOrder: 1, pieceCount: 1 },
      { id: "single-piece", name: "Single Piece", active: true, sortOrder: 0, pieceCount: 1 },
      { id: "2-pieces", name: "2 Pieces", active: true, sortOrder: 2, pieceCount: 2 },
      { id: "hidden", name: "Hidden", active: false, sortOrder: 3, pieceCount: 3 },
    ],
  }, {
    id: "empty-line",
    optionId: "series.empty-line",
    bodyConstruction: [],
  }],
  shapes: [{ id: "offset", optionId: "body-shape.offset", active: true }],
  scales: [{ id: "25.5", optionId: "scale.25.5", active: true, type: "standard" }],
  stringCounts: [],
  radii: [],
  bodyWoods: [
    { id: "mahogany", optionId: "body-wood.mahogany", active: true },
    { id: "alder", optionId: "body-wood.alder", active: true },
  ],
  topWoods: [],
};

const catalog = {
  categories: [
    {
      id: "instrument-type",
      required: true,
      selectionMode: "single",
      step: 1,
      options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", active: true }],
    },
    {
      id: "series",
      required: false,
      selectionMode: "single",
      step: 1,
      options: [{
        id: "series.solid-body",
        code: "solid-body",
        active: true,
        attributes: {
          wizardId: "solid-body",
          bodyConstruction: [
            { id: "1-piece", translations: { en: { name: "1 Piece" }, vi: { name: "1 mảnh" } }, active: true, sortOrder: 0, pieceCount: 1 },
            { id: "2-pieces", translations: { en: { name: "2 Pieces" }, vi: { name: "2 mảnh" } }, active: true, sortOrder: 1, pieceCount: 2 },
          ],
        },
      }],
    },
    {
      id: "body-wood",
      required: true,
      selectionMode: "single",
      step: 2,
      options: [
        { id: "body-wood.mahogany", code: "mahogany", active: true },
        { id: "body-wood.alder", code: "alder", active: true },
      ],
    },
  ],
};

function stepOne(extra = {}) {
  return {
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
    scaleId: "25.5",
    bodyWoodId: "mahogany",
    ...extra,
  };
}

test("piece count uses metadata then stable identifiers, not display names", () => {
  assert.equal(parseConstructionPieceCount({ id: "custom", pieceCount: 3 }), 3);
  assert.equal(parseConstructionPieceCount({ id: "single-piece", name: "Anything" }), 1);
  assert.equal(parseConstructionPieceCount({ id: "1-piece" }), 1);
  assert.equal(parseConstructionPieceCount({ id: "2-pieces" }), 2);
  assert.equal(parseConstructionPieceCount({ id: "3-piece" }), 3);
  assert.equal(parseConstructionPieceCount({ id: "multi-piece" }), 2);
  assert.equal(parseConstructionPieceCount({ id: "laminated-core", name: "2 Pieces" }), null);
  assert.equal(usesSecondaryBodyWood({ id: "1-piece" }), false);
  assert.equal(usesSecondaryBodyWood({ id: "single-piece" }), false);
  assert.equal(usesSecondaryBodyWood({ id: "2-pieces" }), true);
  assert.equal(usesSecondaryBodyWood({ id: "laminated-core" }), false);
});

test("series body constructions stay in admin order and skip inactive rows", () => {
  const options = seriesBodyConstructionOptions(lists.series[0]);
  assert.deepEqual(options.map((item) => item.id), ["single-piece", "1-piece", "2-pieces"]);
  assert.equal(seriesBodyConstructionOptions(lists.series[1]).length, 0);
  assert.equal(seriesBodyConstructionOptions(null).length, 0);
});

test("prune keeps secondary wood when switching to one piece and drops invalid construction", () => {
  const kept = pruneSelections({
    ...stepOne({
      bodyConstructionId: "2-pieces",
      secondaryBodyWoodId: "alder",
    }),
  }, lists);
  assert.equal(kept.bodyConstructionId, "2-pieces");
  assert.equal(kept.secondaryBodyWoodId, "alder");
  assert.equal(kept.bodyWoodId, "mahogany");

  const onePiece = pruneSelections({ ...kept, bodyConstructionId: "1-piece" }, lists);
  assert.equal(onePiece.bodyConstructionId, "1-piece");
  assert.equal(onePiece.secondaryBodyWoodId, "alder");
  assert.equal(onePiece.bodyWoodId, "mahogany");

  const unknown = pruneSelections({ ...kept, bodyConstructionId: "not-on-series" }, lists);
  assert.equal(unknown.bodyConstructionId, "single-piece");
  assert.equal(unknown.secondaryBodyWoodId, "alder");
});

test("visible dropdown defaults fill empty body construction and wood without a second click", () => {
  const filled = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
    scaleId: "25.5",
    bodyConstructionId: null,
    bodyWoodId: null,
  }, lists);
  assert.equal(filled.bodyConstructionId, "single-piece");
  assert.equal(filled.bodyWoodId, "mahogany");
  const twoPieceFirst = {
    ...lists,
    series: [{
      ...lists.series[0],
      bodyConstruction: [
        { id: "2-pieces", name: "2 Pieces", active: true, sortOrder: 0, pieceCount: 2 },
        { id: "single-piece", name: "Single Piece", active: true, sortOrder: 1, pieceCount: 1 },
      ],
    }],
  };
  const laminated = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
    scaleId: "25.5",
    bodyConstructionId: null,
    bodyWoodId: null,
    secondaryBodyWoodId: null,
  }, twoPieceFirst);
  assert.equal(laminated.bodyConstructionId, "2-pieces");
  assert.equal(laminated.bodyWoodId, "mahogany");
  assert.equal(laminated.secondaryBodyWoodId, "alder");
});

function bodyWoodStepReady(selections, series) {
  const constructions = seriesBodyConstructionOptions(series);
  if (constructions.length > 0 && !selections.bodyConstructionId) return false;
  if (!selections.bodyWoodId) return false;
  const construction = findSeriesConstructionOption(series, selections.bodyConstructionId);
  if (usesSecondaryBodyWood(construction) && !selections.secondaryBodyWoodId) return false;
  return true;
}

test("step two missing fields include body pieces when the dropdown looks selected but state is empty", () => {
  const available = {
    constructions: [{ id: "single-piece" }, { id: "2-pieces" }],
    bodyWoods: [{ id: "mahogany" }],
    usesSecondary: false,
    topApplicable: true,
    tops: [{ id: "flamed-maple" }],
  };
  assert.deepEqual(
    collectStepTwoMissing(
      { bodyConstructionId: null, bodyWoodId: "mahogany", topWoodId: "flamed-maple" },
      available,
    ).map((item) => item.key),
    ["bodyConstructionId"],
  );
  assert.deepEqual(
    collectStepTwoMissing(
      { bodyConstructionId: "single-piece", bodyWoodId: "mahogany", topWoodId: "flamed-maple" },
      available,
    ).map((item) => item.key),
    [],
  );
  assert.equal(
    collectStepTwoMissing(
      { bodyConstructionId: "2-pieces", bodyWoodId: "mahogany", topWoodId: "flamed-maple" },
      { ...available, usesSecondary: true },
    ).some((item) => item.key === "secondaryBodyWoodId"),
    true,
  );
  assert.equal(tFor("en", "customBuild.step2.incomplete").includes("highlighted"), true);
  assert.equal(tFor("vi", "customBuild.step2.incomplete").includes("đánh dấu"), true);
  assert.deepEqual(
    collectStepTwoMissing(
      { bodyConstructionId: null, bodyWoodId: null, topWoodId: null },
      { constructions: [], bodyWoods: [], usesSecondary: false, topApplicable: false, tops: [] },
    ).map((item) => item.key),
    [],
  );
});

test("step two requires construction and secondary wood only when they apply", () => {
  const series = lists.series[0];
  const emptySeries = lists.series[1];
  assert.deepEqual(seriesBodyConstructionOptions(series).map((item) => item.id), ["single-piece", "1-piece", "2-pieces"]);
  assert.equal(bodyWoodStepReady(stepOne(), series), false);
  assert.equal(bodyWoodStepReady(stepOne({ bodyConstructionId: "1-piece" }), series), true);
  assert.equal(bodyWoodStepReady(stepOne({ bodyConstructionId: "2-pieces" }), series), false);
  assert.equal(bodyWoodStepReady(stepOne({ bodyConstructionId: "2-pieces", secondaryBodyWoodId: "alder" }), series), true);
  assert.equal(bodyWoodStepReady(stepOne({ seriesId: "empty-line" }), emptySeries), true);
});

test("inquiry notes store construction and secondary without extra mapped categories", () => {
  const payload = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      bodyWoodId: "mahogany",
      bodyConstructionId: "2-pieces",
      secondaryBodyWoodId: "alder",
    },
    language: "en",
    draftId: "draft-body",
    catalog,
  });
  assert.equal(payload.configuration.selections["body-wood"], "body-wood.mahogany");
  assert.equal(Object.hasOwn(payload.configuration.selections, "body-construction"), false);
  assert.equal(Object.hasOwn(payload.configuration.selections, "secondary-body-wood"), false);
  const parsed = parseInquiryNotes(payload.configuration.notes);
  assert.equal(parsed.wizard.bodyConstructionId, "2-pieces");
  assert.equal(parsed.wizard.secondaryBodyWoodId, "alder");
  assert.equal(parsed.wizard.bodyWoodId, "mahogany");

  const onePiece = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      bodyWoodId: "mahogany",
      bodyConstructionId: "1-piece",
      secondaryBodyWoodId: "alder",
    },
    language: "en",
    catalog,
  });
  const oneParsed = parseInquiryNotes(onePiece.configuration.notes);
  assert.equal(oneParsed.wizard.bodyConstructionId, "1-piece");
  assert.equal(oneParsed.wizard.secondaryBodyWoodId, undefined);

  const issues = evaluateWizardNotesSelections({
    seriesId: "solid-body",
    bodyConstructionId: "2-pieces",
  }, catalog);
  assert.equal(issues.some((item) => item.field === "selections.secondary-body-wood" && item.code === "REQUIRED"), true);
});

test("inquiry display shows new body rows without changing legacy body wood meaning", () => {
  const t = (key) => tFor("en", key);
  const legacy = buildInquiryDisplay({
    configuration: {
      selections: { "body-wood": "body-wood.mahogany" },
      notes: "wizard:\nbodyWoodId=mahogany",
    },
  }, t);
  const body = legacy.groups.find((group) => group.id === "body");
  assert.equal(body.rows.some((row) => row.labelKey === "customBuild.summary.bodyPieces"), false);
  assert.equal(body.rows.some((row) => row.labelKey === "customBuild.summary.bodyWood"), true);

  const modern = buildInquiryDisplay({
    configuration: {
      selections: { "body-wood": "body-wood.mahogany" },
      notes: "wizard:\nseriesId=solid-body\nbodyConstructionId=2-pieces\nbodyWoodId=mahogany\nsecondaryBodyWoodId=alder",
    },
  }, t, { catalog, language: "en" });
  const modernBody = modern.groups.find((group) => group.id === "body");
  assert.equal(modernBody.rows.find((row) => row.labelKey === "customBuild.summary.bodyPieces")?.value, "2 Pieces");
  assert.equal(modernBody.rows.find((row) => row.labelKey === "customBuild.summary.mainBodyWood")?.value, "Mahogany");
  assert.equal(modernBody.rows.find((row) => row.labelKey === "customBuild.summary.secondaryBodyWood")?.value, "Alder");
});
