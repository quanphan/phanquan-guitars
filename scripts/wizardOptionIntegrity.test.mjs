import assert from "node:assert/strict";
import test from "node:test";
import {
  applySeriesSuggestion,
  buildWizardOptionCreatePayload,
  buildWizardOptionUpdatePayload,
  formFromWizardOption,
  isIdentifierLocked,
  wizardOptionImagePath,
} from "../src/data/wizardOptionPayload.js";

const categories = [
  {
    id: "instrument-type",
    options: [
      { id: "instrument-type.electric-guitar", code: "electric-guitar", name: "Electric Guitar", active: true },
      { id: "instrument-type.headless-guitar", code: "headless-guitar", name: "Headless Guitar", active: true },
      { id: "instrument-type.bass", code: "bass", name: "Bass", active: true },
    ],
  },
  {
    id: "series",
    options: [
      {
        id: "series.headless",
        code: "headless",
        name: "PQ-BOUTIQUE",
        active: true,
        sortOrder: 2,
        isDefault: false,
        defaultForInstrumentTypeIds: ["electric-guitar"],
        icon: "series",
        imagePath: "/uploads/categories/boutique.png",
        attributes: { wizardId: "headless" },
        compatibility: { instrumentTypeIds: ["electric-guitar", "headless-guitar"] },
        translations: {
          vi: { name: "PQ-BOUTIQUE", description: "Dòng boutique" },
          en: { name: "PQ-BOUTIQUE", description: "Boutique line" },
        },
      },
      {
        id: "series.solid-body",
        code: "solid-body",
        name: "PQ-ESSENTIAL",
        active: true,
        compatibility: { instrumentTypeIds: ["electric-guitar", "bass"] },
        translations: { vi: { name: "PQ-ESSENTIAL" }, en: { name: "PQ-ESSENTIAL" } },
      },
    ],
  },
  {
    id: "body-shape",
    options: [
      {
        id: "body-shape.compact-modern",
        code: "compact-modern",
        name: "Compact Modern",
        active: true,
        compatibility: { seriesIds: ["headless", "solid-body"] },
      },
    ],
  },
];

const boutique = categories[1].options[0];
const essential = categories[1].options[1];

function renameForm(option, { viName, enName }) {
  const form = formFromWizardOption(option, "series", categories);
  return { ...form, viName, enName };
}

test("Test A — renaming a series keeps id, code, and compatibility in the update payload", () => {
  const form = renameForm(boutique, { viName: "PQ-BOUTIQUE CUSTOM", enName: "PQ-BOUTIQUE CUSTOM" });
  const body = buildWizardOptionUpdatePayload(form, {
    canScopeDefault: true,
    instrumentTypes: categories[0].options,
    categories,
  });
  assert.equal(Object.hasOwn(body, "code"), false);
  assert.equal(form.code, "headless");
  assert.equal(body.name, "PQ-BOUTIQUE CUSTOM");
  assert.equal(body.translations.en.name, "PQ-BOUTIQUE CUSTOM");
  assert.equal(body.translations.vi.name, "PQ-BOUTIQUE CUSTOM");
  assert.deepEqual(body.compatibility.instrumentTypeIds, ["electric-guitar", "headless-guitar"]);
  assert.equal(body.active, true);
  assert.equal(body.isDefault, false);
  assert.deepEqual(body.defaultForInstrumentTypeIds, ["electric-guitar"]);
  assert.equal(body.icon, "series");
  assert.equal(body.imagePath, "/uploads/categories/boutique.png");
  assert.deepEqual(body.attributes, { wizardId: "headless" });
  assert.deepEqual(
    formFromWizardOption(essential, "series", categories).compatibility.instrumentTypeIds,
    ["electric-guitar", "bass"],
  );
  assert.equal(body.translations.en.description, "Boutique line");
  assert.equal(body.translations.vi.description, "Dòng boutique");
});

test("Test B — renaming an option leaves other configuration fields on the form", () => {
  const form = renameForm(boutique, { viName: "Dòng Boutique mới", enName: "Boutique Custom" });
  assert.equal(form.code, boutique.code);
  assert.equal(form.active, boutique.active);
  assert.equal(form.isDefault, boutique.isDefault);
  assert.deepEqual(form.defaultForInstrumentTypeIds, boutique.defaultForInstrumentTypeIds);
  assert.deepEqual(form.compatibility.instrumentTypeIds, boutique.compatibility.instrumentTypeIds);
  assert.deepEqual(form.attributes, boutique.attributes);
  assert.equal(form.icon, boutique.icon);
  assert.equal(form.imagePath, boutique.imagePath);
});

test("Test C — identifier is locked in edit mode and series autocomplete does not rewrite code", () => {
  assert.equal(isIdentifierLocked(true), false);
  assert.equal(isIdentifierLocked(false), true);
  const form = formFromWizardOption(boutique, "series", categories);
  const next = applySeriesSuggestion(form, {
    enName: "PQ-BOUTIQUE SERIES",
    viName: "Dòng Boutique",
    slug: "pq-boutique-series",
  }, { isNew: false });
  assert.equal(next.code, "headless");
  assert.equal(next.enName, "PQ-BOUTIQUE SERIES");
  const created = applySeriesSuggestion({ ...form, code: "" }, {
    enName: "PQ-BOUTIQUE SERIES",
    viName: "Dòng Boutique",
    slug: "pq-boutique-series",
  }, { isNew: true });
  assert.equal(created.code, "pq-boutique-series");
});

test("Test D — editing one option name does not rewrite another option's compatibility payload", () => {
  const renamed = buildWizardOptionUpdatePayload(
    renameForm(boutique, { viName: "PQ-BOUTIQUE CUSTOM", enName: "PQ-BOUTIQUE CUSTOM" }),
    { canScopeDefault: true, instrumentTypes: categories[0].options, categories },
  );
  const other = buildWizardOptionUpdatePayload(
    formFromWizardOption(essential, "series", categories),
    { canScopeDefault: true, instrumentTypes: categories[0].options, categories },
  );
  assert.deepEqual(renamed.compatibility.instrumentTypeIds, ["electric-guitar", "headless-guitar"]);
  assert.deepEqual(other.compatibility.instrumentTypeIds, ["electric-guitar", "bass"]);
  const shape = formFromWizardOption(categories[2].options[0], "body-shape", categories);
  assert.deepEqual(shape.compatibility.seriesIds, ["headless", "solid-body"]);
});

test("Test E — a name-only update payload omits the identifier and keeps nested compatibility", () => {
  const form = formFromWizardOption(boutique, "series", categories);
  form.enName = "PQ-BOUTIQUE CUSTOM";
  form.viName = "PQ-BOUTIQUE CUSTOM";
  const body = buildWizardOptionUpdatePayload(form, {
    canScopeDefault: true,
    instrumentTypes: categories[0].options,
    categories,
  });
  assert.equal(Object.hasOwn(body, "code"), false);
  assert.equal(Object.hasOwn(body, "id"), false);
  assert.deepEqual(body.compatibility.instrumentTypeIds, boutique.compatibility.instrumentTypeIds);
  assert.deepEqual(body.attributes, boutique.attributes);
});

test("description EN and VI stay independent across load, create, and partial edits", () => {
  const loaded = formFromWizardOption(boutique, "series", categories);
  assert.equal(loaded.enDescription, "Boutique line");
  assert.equal(loaded.viDescription, "Dòng boutique");

  const legacy = formFromWizardOption({
    ...essential,
    description: "Legacy English note",
    translations: { en: { name: "PQ-ESSENTIAL" }, vi: { name: "PQ-ESSENTIAL" } },
  }, "series", categories);
  assert.equal(legacy.enDescription, "Legacy English note");
  assert.equal(legacy.viDescription, "");

  const objectRoot = formFromWizardOption({
    ...essential,
    description: { en: "Object EN", vi: "Object VI" },
    translations: { en: { name: "PQ-ESSENTIAL" }, vi: { name: "PQ-ESSENTIAL" } },
  }, "series", categories);
  assert.equal(objectRoot.enDescription, "Object EN");
  assert.equal(objectRoot.viDescription, "Object VI");

  const both = buildWizardOptionCreatePayload({
    categoryId: "body-wood",
    code: "alder-desc",
    enName: "Alder",
    viName: "Alder",
    enDescription: "Light body wood",
    viDescription: "Gỗ thân nhẹ",
    icon: "",
    imagePath: "",
    active: true,
    isDefault: false,
    defaultForInstrumentTypeIds: [],
    attributes: {},
    compatibility: {},
  }, { canScopeDefault: false, instrumentTypes: [], categories });
  assert.equal(both.description, "Light body wood");
  assert.equal(both.translations.en.description, "Light body wood");
  assert.equal(both.translations.vi.description, "Gỗ thân nhẹ");

  const enOnly = buildWizardOptionCreatePayload({
    categoryId: "inlay",
    code: "offset-dots",
    enName: "Offset dots",
    viName: "Chấm lệch",
    enDescription: "English only",
    viDescription: "",
    icon: "",
    imagePath: "",
    active: true,
    isDefault: false,
    defaultForInstrumentTypeIds: [],
    attributes: {},
    compatibility: {},
  }, { canScopeDefault: false, instrumentTypes: [], categories });
  assert.equal(enOnly.translations.en.description, "English only");
  assert.equal(enOnly.translations.vi.description, "");

  const viOnly = buildWizardOptionCreatePayload({
    categoryId: "inlay",
    code: "side-dots",
    enName: "Side dots",
    viName: "Chấm hông",
    enDescription: "",
    viDescription: "Chỉ tiếng Việt",
    icon: "",
    imagePath: "",
    active: true,
    isDefault: false,
    defaultForInstrumentTypeIds: [],
    attributes: {},
    compatibility: {},
  }, { canScopeDefault: false, instrumentTypes: [], categories });
  assert.equal(viOnly.description, "");
  assert.equal(viOnly.translations.en.description, "");
  assert.equal(viOnly.translations.vi.description, "Chỉ tiếng Việt");

  const editedEn = buildWizardOptionUpdatePayload({
    ...loaded,
    enDescription: "Updated boutique line",
  }, { canScopeDefault: true, instrumentTypes: categories[0].options, categories });
  assert.equal(editedEn.translations.en.description, "Updated boutique line");
  assert.equal(editedEn.translations.vi.description, "Dòng boutique");

  const editedVi = buildWizardOptionUpdatePayload({
    ...loaded,
    viDescription: "Dòng boutique mới",
  }, { canScopeDefault: true, instrumentTypes: categories[0].options, categories });
  assert.equal(editedVi.translations.en.description, "Boutique line");
  assert.equal(editedVi.translations.vi.description, "Dòng boutique mới");
});

test("create payloads still include a code and sanitize newly selected compatibility", () => {
  const form = {
    categoryId: "series",
    code: "new-line",
    enName: "New Line",
    viName: "Dòng mới",
    description: "",
    icon: "",
    imagePath: "",
    active: true,
    isDefault: false,
    defaultForInstrumentTypeIds: [],
    attributes: {},
    compatibility: { instrumentTypeIds: ["electric-guitar"] },
  };
  const body = buildWizardOptionCreatePayload(form, {
    canScopeDefault: true,
    instrumentTypes: categories[0].options,
    categories,
  });
  assert.equal(body.code, "new-line");
  assert.deepEqual(body.compatibility.instrumentTypeIds, ["electric-guitar"]);
});

test("wizard option image path prefers imagePath then image then attributes.image", () => {
  assert.equal(wizardOptionImagePath({ imagePath: "/uploads/a.jpg", image: "/uploads/b.jpg" }), "/uploads/a.jpg");
  assert.equal(wizardOptionImagePath({ image: " /uploads/b.jpg " }), "/uploads/b.jpg");
  assert.equal(wizardOptionImagePath({ attributes: { image: "/uploads/c.jpg" } }), "/uploads/c.jpg");
  assert.equal(wizardOptionImagePath({}), "");
  assert.equal(wizardOptionImagePath(null), "");
});

test("editing an old option with iconKey still round-trips icon without requiring the admin field", () => {
  const legacy = {
    ...boutique,
    icon: "electric",
    attributes: { ...boutique.attributes, icon: "electric" },
  };
  const form = formFromWizardOption(legacy, "series", categories);
  assert.equal(form.icon, "electric");
  const body = buildWizardOptionUpdatePayload(form, {
    canScopeDefault: true,
    instrumentTypes: categories[0].options,
    categories,
  });
  assert.equal(body.icon, "electric");
  assert.equal(body.imagePath, boutique.imagePath);
});
