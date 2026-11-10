import assert from "node:assert/strict";
import test from "node:test";
import {
  BODY_CONSTRUCTION_ATTR,
  NECK_CONSTRUCTION_ATTR,
  constructionListFromAttributes,
  mergeSeriesConstructionAttributes,
  moveConstructionOption,
  parseConstructionPieceCount,
  sanitizeConstructionList,
  usesSecondaryBodyWood,
} from "../src/data/wizardSeriesConstruction.js";
import {
  buildWizardOptionCreatePayload,
  buildWizardOptionUpdatePayload,
  formFromWizardOption,
} from "../src/data/wizardOptionPayload.js";

const categories = [
  { id: "instrument-type", options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", name: "Electric Guitar", active: true }] },
  { id: "series", options: [] },
];

test("construction ids stay stable when names change and empty series omit the fields", () => {
  const saved = sanitizeConstructionList([
    { id: "1-piece", enName: "1 Piece", viName: "1 mảnh", active: true },
    { enName: "2 Pieces", viName: "2 mảnh", active: true },
  ]);
  assert.equal(saved[0].id, "1-piece");
  assert.equal(saved[0].pieceCount, 1);
  assert.equal(saved[1].id, "2-pieces");
  assert.equal(saved[1].pieceCount, 2);
  assert.equal(usesSecondaryBodyWood(saved[0]), false);
  assert.equal(usesSecondaryBodyWood(saved[1]), true);
  assert.equal(parseConstructionPieceCount({ id: "single-piece" }), 1);
  const renamed = sanitizeConstructionList([
    { id: "1-piece", enName: "Single piece", viName: "Một mảnh", active: true },
    { id: "2-pieces", enName: "Two piece", viName: "Hai mảnh", active: false },
  ]);
  assert.equal(renamed[0].id, "1-piece");
  assert.equal(renamed[0].translations.en.name, "Single piece");
  assert.equal(renamed[1].active, false);

  const attributes = mergeSeriesConstructionAttributes({ wizardId: "boutique" }, [], []);
  assert.deepEqual(attributes, { wizardId: "boutique" });
  assert.equal(Object.hasOwn(attributes, BODY_CONSTRUCTION_ATTR), false);
  assert.equal(Object.hasOwn(attributes, NECK_CONSTRUCTION_ATTR), false);
});

test("body and neck lists stay independent and reload from stored attributes", () => {
  const attributes = mergeSeriesConstructionAttributes(
    { wizardId: "player" },
    [{ enName: "1 Piece", viName: "1 Piece" }],
    [{ enName: "5-Piece", viName: "5 mảnh" }, { enName: "3-Piece", viName: "3 mảnh" }],
  );
  assert.equal(attributes.bodyConstruction.length, 1);
  assert.equal(attributes.neckConstruction.length, 2);
  assert.equal(attributes.bodyConstruction[0].id, "1-piece");
  assert.equal(attributes.neckConstruction[0].id, "5-piece");
  assert.notEqual(attributes.bodyConstruction[0].id, attributes.neckConstruction[1].id);

  const form = formFromWizardOption({
    code: "player",
    name: "PQ-PLAYER",
    attributes,
    compatibility: { instrumentTypeIds: ["electric-guitar"] },
    translations: { en: { name: "PQ-PLAYER" }, vi: { name: "PQ-PLAYER" } },
  }, "series", categories);
  assert.equal(form.bodyConstruction[0].id, "1-piece");
  assert.equal(form.neckConstruction.map((item) => item.id).join(","), "5-piece,3-piece");

  const other = mergeSeriesConstructionAttributes({ wizardId: "essential" }, [{ enName: "4+ Pieces" }], []);
  assert.equal(other.bodyConstruction[0].id, "4-pieces");
  assert.equal(Object.hasOwn(other, NECK_CONSTRUCTION_ATTR), false);
  assert.notDeepEqual(other.bodyConstruction, attributes.bodyConstruction);
});

test("reordering and clearing a stored list persist without dropping other series attributes", () => {
  const moved = moveConstructionOption(
    [{ id: "a", enName: "A" }, { id: "b", enName: "B" }],
    1,
    -1,
  );
  assert.deepEqual(moved.map((item) => item.id), ["b", "a"]);

  const existing = {
    wizardId: "boutique",
    bodyConstruction: [{ id: "1-piece", translations: { en: { name: "1 Piece" }, vi: { name: "1 Piece" } }, active: true, sortOrder: 0 }],
  };
  const loaded = constructionListFromAttributes(existing, BODY_CONSTRUCTION_ATTR);
  assert.equal(loaded[0].enName, "1 Piece");
  const cleared = mergeSeriesConstructionAttributes(existing, [], []);
  assert.deepEqual(cleared.bodyConstruction, []);
  assert.equal(cleared.wizardId, "boutique");
});

test("series update payload keeps compatibility, code off the body, and writes construction lists", () => {
  const option = {
    id: "series.headless",
    code: "headless",
    name: "PQ-BOUTIQUE",
    active: true,
    attributes: { wizardId: "headless" },
    compatibility: { instrumentTypeIds: ["electric-guitar"] },
    translations: { en: { name: "PQ-BOUTIQUE" }, vi: { name: "PQ-BOUTIQUE" } },
  };
  const form = formFromWizardOption(option, "series", categories);
  form.bodyConstruction = [{ enName: "2 Pieces", viName: "2 mảnh", active: true }];
  form.neckConstruction = [{ enName: "3-Piece", viName: "3-Piece", active: true }];
  const body = buildWizardOptionUpdatePayload(form, {
    canScopeDefault: true,
    instrumentTypes: categories[0].options,
    categories,
  });
  assert.equal(Object.hasOwn(body, "code"), false);
  assert.deepEqual(body.compatibility.instrumentTypeIds, ["electric-guitar"]);
  assert.equal(body.attributes.wizardId, "headless");
  assert.equal(body.attributes.bodyConstruction[0].id, "2-pieces");
  assert.equal(body.attributes.neckConstruction[0].id, "3-piece");

  const created = buildWizardOptionCreatePayload({
    ...form,
    code: "new-line",
    enName: "New Line",
    viName: "Dòng mới",
    categoryId: "series",
  }, { canScopeDefault: true, instrumentTypes: categories[0].options, categories });
  assert.equal(created.code, "new-line");
  assert.equal(created.attributes.bodyConstruction[0].id, "2-pieces");
});
