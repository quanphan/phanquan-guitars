import assert from "node:assert/strict";
import test from "node:test";
import { pruneSelections } from "../src/data/wizardSelection.js";
import {
  findSeriesNeckConstructionOption,
  seriesBodyConstructionOptions,
  seriesNeckConstructionOptions,
  usesSecondaryNeckWood,
} from "../src/data/wizardSeriesConstruction.js";
import { buildInquiryPayload, evaluateWizardNotesSelections } from "../src/services/customBuildPayload.js";
import { buildInquiryDisplay, parseInquiryNotes } from "../src/services/inquiryDisplay.js";
import { collectStepThreeMissing, fingerboardMatchOptions } from "../src/data/wizardStepThree.js";
import { filterOptions } from "../src/data/wizardSelection.js";
import { tFor } from "../src/i18n/translations.js";

const lists = {
  instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", active: true }],
  series: [{
    id: "solid-body",
    optionId: "series.solid-body",
    bodyConstruction: [
      { id: "1-piece", name: "1 Piece", active: true, sortOrder: 0, pieceCount: 1 },
    ],
    neckConstruction: [
      { id: "1-piece", name: "1 Piece", active: true, sortOrder: 1, pieceCount: 1 },
      { id: "single-piece", name: "Single Piece", active: true, sortOrder: 0, pieceCount: 1 },
      { id: "3-piece", name: "3 Piece", active: true, sortOrder: 2, pieceCount: 3 },
      { id: "hidden", name: "Hidden", active: false, sortOrder: 3, pieceCount: 5 },
    ],
  }, {
    id: "empty-line",
    optionId: "series.empty-line",
    neckConstruction: [],
  }],
  shapes: [{ id: "offset", optionId: "body-shape.offset", active: true }],
  scales: [{ id: "25.5", optionId: "scale.25.5", active: true, type: "standard" }],
  stringCounts: [],
  radii: [],
  bodyWoods: [{ id: "mahogany", optionId: "body-wood.mahogany", active: true }],
  neckWoods: [
    { id: "roasted-maple", optionId: "neck-wood.roasted-maple", active: true },
    { id: "mahogany", optionId: "neck-wood.mahogany", active: true },
  ],
  fingerboardWoods: [
    { id: "ebony", optionId: "fingerboard.ebony", active: true, image: "/uploads/fingerboard-ebony.jpg" },
    { id: "maple", optionId: "fingerboard.maple", active: true },
  ],
  neckConstructions: [{ id: "bolt-on", optionId: "neck-construction.bolt-on", active: true }],
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
            { id: "1-piece", translations: { en: { name: "1 Piece" } }, active: true, sortOrder: 0, pieceCount: 1 },
          ],
          neckConstruction: [
            { id: "1-piece", translations: { en: { name: "1 Piece" }, vi: { name: "1 mảnh" } }, active: true, sortOrder: 0, pieceCount: 1 },
            { id: "3-piece", translations: { en: { name: "3 Piece" }, vi: { name: "3 mảnh" } }, active: true, sortOrder: 1, pieceCount: 3 },
          ],
        },
      }],
    },
    {
      id: "neck-wood",
      required: true,
      selectionMode: "single",
      step: 3,
      options: [
        { id: "neck-wood.roasted-maple", code: "roasted-maple", active: true },
        { id: "neck-wood.mahogany", code: "mahogany", active: true },
      ],
    },
    {
      id: "fingerboard",
      required: true,
      selectionMode: "single",
      step: 3,
      options: [
        { id: "fingerboard.ebony", code: "ebony", active: true, imagePath: "/uploads/fingerboard-ebony.jpg" },
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
    neckWoodId: "roasted-maple",
    ...extra,
  };
}

test("neck pieces stay independent from body construction and skip inactive rows", () => {
  const series = lists.series[0];
  assert.deepEqual(seriesBodyConstructionOptions(series).map((item) => item.id), ["1-piece"]);
  assert.deepEqual(seriesNeckConstructionOptions(series).map((item) => item.id), ["single-piece", "1-piece", "3-piece"]);
  assert.equal(seriesNeckConstructionOptions(lists.series[1]).length, 0);
  assert.equal(usesSecondaryNeckWood({ id: "1-piece" }), false);
  assert.equal(usesSecondaryNeckWood({ id: "single-piece" }), false);
  assert.equal(usesSecondaryNeckWood({ id: "3-piece" }), true);
  assert.equal(usesSecondaryNeckWood({ id: "custom-laminate", name: "3 Piece" }), false);
});

function neckStepReady(selections, series) {
  const constructions = seriesNeckConstructionOptions(series);
  if (constructions.length > 0 && !selections.neckPiecesId) return false;
  if (!selections.neckWoodId) return false;
  const construction = findSeriesNeckConstructionOption(series, selections.neckPiecesId);
  if (usesSecondaryNeckWood(construction) && !selections.secondaryNeckWoodId) return false;
  return true;
}

test("step three requires neck pieces and secondary wood only when they apply", () => {
  const series = lists.series[0];
  assert.equal(neckStepReady(stepOne(), series), false);
  assert.equal(neckStepReady(stepOne({ neckPiecesId: "1-piece" }), series), true);
  assert.equal(neckStepReady(stepOne({ neckPiecesId: "3-piece" }), series), false);
  assert.equal(neckStepReady(stepOne({ neckPiecesId: "3-piece", secondaryNeckWoodId: "mahogany" }), series), true);
  assert.equal(neckStepReady(stepOne({ seriesId: "empty-line" }), lists.series[1]), true);
});

test("prune keeps secondary neck wood when switching to one piece and does not mix body lists", () => {
  const kept = pruneSelections(stepOne({
    neckPiecesId: "3-piece",
    secondaryNeckWoodId: "mahogany",
    bodyConstructionId: "1-piece",
  }), lists);
  assert.equal(kept.neckPiecesId, "3-piece");
  assert.equal(kept.secondaryNeckWoodId, "mahogany");
  assert.equal(kept.bodyConstructionId, "1-piece");

  const onePiece = pruneSelections({ ...kept, neckPiecesId: "single-piece" }, lists);
  assert.equal(onePiece.neckPiecesId, "single-piece");
  assert.equal(onePiece.secondaryNeckWoodId, "mahogany");
  assert.equal(onePiece.neckWoodId, "roasted-maple");

  const unknown = pruneSelections({ ...kept, neckPiecesId: "not-on-series" }, lists);
  assert.equal(unknown.neckPiecesId, "single-piece");
  assert.equal(unknown.secondaryNeckWoodId, "mahogany");
});

test("visible dropdown defaults fill empty neck pieces and wood without a second click", () => {
  const filled = pruneSelections({
    instrumentTypeId: "electric-guitar",
    seriesId: "solid-body",
    shapeId: "offset",
    scaleId: "25.5",
    bodyWoodId: "mahogany",
    neckPiecesId: null,
    neckWoodId: null,
  }, lists);
  assert.equal(filled.neckPiecesId, "single-piece");
  assert.equal(filled.neckWoodId, "roasted-maple");
});

test("inquiry notes store neck pieces without colliding with bolt-on neck construction", () => {
  const payload = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      neckWoodId: "roasted-maple",
      neckPiecesId: "3-piece",
      secondaryNeckWoodId: "mahogany",
      neckConstructionId: "bolt-on",
      fingerboardWoodId: "ebony",
    },
    language: "en",
    catalog,
  });
  assert.equal(payload.configuration.selections["neck-wood"], "neck-wood.roasted-maple");
  assert.equal(payload.configuration.selections.fingerboard, "fingerboard.ebony");
  assert.equal(Object.hasOwn(payload.configuration.selections, "neck-pieces"), false);
  const parsed = parseInquiryNotes(payload.configuration.notes);
  assert.equal(parsed.wizard.neckPiecesId, "3-piece");
  assert.equal(parsed.wizard.secondaryNeckWoodId, "mahogany");
  assert.equal(parsed.wizard.neckWoodId, "roasted-maple");
  assert.equal(parsed.wizard.fingerboardWoodId, "ebony");

  const onePiece = buildInquiryPayload({
    selections: {
      contactName: "Lan Pham",
      contactEmail: "lan@example.com",
      contactPhone: "",
      contactMessage: "",
      instrumentTypeId: "electric-guitar",
      seriesId: "solid-body",
      neckWoodId: "roasted-maple",
      neckPiecesId: "1-piece",
      secondaryNeckWoodId: "mahogany",
      fingerboardWoodId: "ebony",
    },
    language: "en",
    catalog,
  });
  const oneParsed = parseInquiryNotes(onePiece.configuration.notes);
  assert.equal(oneParsed.wizard.neckPiecesId, "1-piece");
  assert.equal(oneParsed.wizard.secondaryNeckWoodId, undefined);

  const issues = evaluateWizardNotesSelections({
    seriesId: "solid-body",
    neckPiecesId: "3-piece",
  }, catalog);
  assert.equal(issues.some((item) => item.field === "selections.secondary-neck-wood" && item.code === "REQUIRED"), true);
});

test("inquiry display adds neck piece rows without changing legacy neck wood meaning", () => {
  const t = (key) => tFor("en", key);
  const legacy = buildInquiryDisplay({
    configuration: {
      selections: { "neck-wood": "neck-wood.mahogany" },
      notes: "wizard:\nneckWoodId=mahogany",
    },
  }, t);
  const neck = legacy.groups.find((group) => group.id === "neck");
  assert.equal(neck.rows.some((row) => row.labelKey === "customBuild.summary.neckPieces"), false);
  assert.equal(neck.rows.some((row) => row.labelKey === "customBuild.summary.neckWood"), true);

  const modern = buildInquiryDisplay({
    configuration: {
      selections: { "neck-wood": "neck-wood.roasted-maple" },
      notes: "wizard:\nseriesId=solid-body\nneckPiecesId=3-piece\nneckWoodId=roasted-maple\nsecondaryNeckWoodId=mahogany\nfingerboardWoodId=ebony",
    },
  }, t, { catalog, language: "en" });
  const modernNeck = modern.groups.find((group) => group.id === "neck");
  assert.equal(modernNeck.rows.find((row) => row.labelKey === "customBuild.summary.neckPieces")?.value, "3 Piece");
  assert.equal(modernNeck.rows.find((row) => row.labelKey === "customBuild.summary.mainNeckWood")?.value, "Roasted maple");
  assert.equal(modernNeck.rows.find((row) => row.labelKey === "customBuild.summary.secondaryNeckWood")?.value, "Mahogany");
});

test("step three missing fields follow neck pieces, woods, and fret count rules", () => {
  const available = {
    neckPieces: [{ id: "1-piece" }, { id: "3-piece" }],
    neckWoods: [{ id: "roasted-maple" }],
    constructions: [{ id: "set-neck" }],
    fingerboards: [{ id: "ebony" }],
    profiles: [{ id: "thin-c" }],
    fretSpecs: [{ id: "stainless-jumbo" }],
  };
  const filled = {
    neckPiecesId: "1-piece",
    neckWoodId: "roasted-maple",
    neckConstructionId: "set-neck",
    fingerboardWoodId: "ebony",
    neckProfileId: "thin-c",
    fretSpecId: "stainless-jumbo",
    fretCount: 24,
  };
  assert.deepEqual(collectStepThreeMissing(filled, available).map((item) => item.key), []);
  assert.equal(
    collectStepThreeMissing({ ...filled, neckWoodId: null }, available).some((item) => item.key === "neckWoodId"),
    true,
  );
  assert.equal(
    collectStepThreeMissing({ ...filled, neckPiecesId: "3-piece" }, { ...available, usesSecondary: true })
      .some((item) => item.key === "secondaryNeckWoodId"),
    true,
  );
  assert.deepEqual(
    collectStepThreeMissing(
      { ...filled, neckPiecesId: "3-piece", secondaryNeckWoodId: "mahogany" },
      { ...available, usesSecondary: true },
    ).map((item) => item.key),
    [],
  );
  assert.equal(
    collectStepThreeMissing({ ...filled, neckPiecesId: "1-piece", secondaryNeckWoodId: null }, available)
      .some((item) => item.key === "secondaryNeckWoodId"),
    false,
  );
  assert.equal(
    collectStepThreeMissing({ ...filled, fretCount: "0" }, available).some((item) => item.key === "fretCount"),
    true,
  );
  assert.equal(
    collectStepThreeMissing({ ...filled, fretCount: 27 }, available).some((item) => item.key === "fretCount"),
    true,
  );
  assert.equal(
    collectStepThreeMissing(filled, { ...available, constructions: [], profiles: [], fretSpecs: [] })
      .some((item) => item.key === "neckConstructionId" || item.key === "neckProfileId"),
    false,
  );
  assert.equal(
    collectStepThreeMissing(
      { ...filled, neckPiecesId: null, neckWoodId: null, fingerboardWoodId: null, neckConstructionId: null, neckProfileId: null, fretSpecId: null },
      { neckPieces: [], neckWoods: [], constructions: [], fingerboards: [], profiles: [], fretSpecs: [] },
    ).some((item) => item.key !== "fretCount"),
    false,
  );
  assert.equal(tFor("en", "customBuild.step3.incomplete").includes("highlighted"), true);
  assert.equal(tFor("vi", "customBuild.step3.incomplete").includes("đánh dấu"), true);
});

test("step three requires scale, strings, and radius before existing neck fields", () => {
  const available = {
    scales: [{ id: "25.5" }, { id: "custom-scale", attributes: { custom: true } }],
    stringCounts: [{ id: "6", value: 6 }],
    radii: [{ id: "16" }],
    neckPieces: [],
    neckWoods: [],
    constructions: [],
    fingerboards: [],
    profiles: [],
    fretSpecs: [],
  };
  const missing = collectStepThreeMissing({ fretCount: 24 }, available).map((item) => item.key);
  assert.deepEqual(missing, ["scaleId", "stringCount", "radiusId"]);
  assert.deepEqual(
    collectStepThreeMissing(
      { scaleId: "25.5", stringCount: 6, radiusId: "16", fretCount: 24 },
      available,
    ).map((item) => item.key),
    [],
  );
  assert.equal(
    collectStepThreeMissing(
      { scaleId: "custom-scale", customScaleValue: "", stringCount: 6, radiusId: "16", fretCount: 24 },
      available,
    ).some((item) => item.key === "scaleId"),
    true,
  );
});

test("fingerboard options stay visible without main neck wood and ignore stale body/top lists", () => {
  const lists = {
    instrumentTypes: [{ id: "electric-guitar", optionId: "instrument-type.electric-guitar", active: true }],
    series: [{ id: "pq-h", optionId: "series.pq-h", active: true }],
    shapes: [{ id: "double-cut", optionId: "body-shape.double-cut", active: true }],
    bodyWoods: [{ id: "teak", optionId: "body-wood.teak", active: true }],
    topWoods: [{ id: "exotic", optionId: "top-wood.exotic", active: true }],
    neckWoods: [{ id: "hard-maple", optionId: "neck-wood.hard-maple", active: true }],
    neckConstructions: [{ id: "set-neck", optionId: "neck-construction.set-neck", active: true }],
    fingerboardWoods: [{
      id: "ebony",
      optionId: "fingerboard.ebony",
      active: true,
      instrumentTypeIds: ["electric-guitar"],
      seriesIds: ["pq-h"],
      shapeIds: ["double-cut"],
      bodyWoodIds: ["mahogany"],
      topWoodIds: ["maple"],
      neckWoodIds: ["hard-maple"],
      neckConstructionIds: ["set-neck"],
    }],
  };
  const selected = {
    instrumentTypeId: "electric-guitar",
    seriesId: "pq-h",
    shapeId: "double-cut",
    bodyWoodId: "teak",
    topWoodId: "exotic",
    neckWoodId: null,
    neckConstructionId: "set-neck",
  };
  assert.deepEqual(
    filterOptions(lists.fingerboardWoods, selected, lists, "fingerboard").map((item) => item.id),
    [],
  );
  assert.deepEqual(
    filterOptions(fingerboardMatchOptions(lists.fingerboardWoods), selected, lists, "fingerboard").map((item) => item.id),
    ["ebony"],
  );
  assert.deepEqual(
    filterOptions(
      fingerboardMatchOptions(lists.fingerboardWoods),
      { ...selected, neckWoodId: "hard-maple" },
      lists,
      "fingerboard",
    ).map((item) => item.id),
    ["ebony"],
  );
});
