import assert from "node:assert/strict";
import test from "node:test";
import {
  addToAllConfigUpdates,
  groupsUsingBodyShapeCompatibility,
  mergeShapeIntoExistingList,
} from "../src/data/wizardAddToAllConfig.js";
import { listsFromPublicCatalog } from "../src/data/wizardCatalog.js";
import {
  buildWizardOptionCreatePayload,
  buildWizardOptionUpdatePayload,
  formFromWizardOption,
} from "../src/data/wizardOptionPayload.js";
import { isGlbPath, storedFileName, wizardOptionModel3DUrl } from "../src/data/wizardOptionModel.js";
import { followingGroupIds } from "../src/data/wizardSetupLayout.js";

const categories = [
  {
    id: "instrument-type",
    step: 1,
    options: [{ id: "instrument-type.electric-guitar", code: "electric-guitar", name: "Electric Guitar", active: true }],
  },
  {
    id: "series",
    step: 1,
    options: [{
      id: "series.headless",
      code: "headless",
      name: "PQ-BOUTIQUE",
      active: true,
      compatibility: { instrumentTypeIds: ["electric-guitar"] },
    }],
  },
  {
    id: "body-shape",
    step: 1,
    options: [{
      id: "body-shape.offset",
      code: "offset",
      name: "Offset",
      active: true,
      imagePath: "/uploads/categories/offset.png",
      compatibility: { instrumentTypeIds: ["electric-guitar"], seriesIds: ["headless"] },
    }],
  },
  {
    id: "body-wood",
    step: 2,
    options: [
      {
        id: "body-wood.alder",
        code: "alder",
        name: "Alder",
        active: true,
        isDefault: true,
        sortOrder: 3,
        compatibility: {
          instrumentTypeIds: ["electric-guitar"],
          seriesIds: ["headless"],
          shapeIds: ["offset"],
        },
      },
      {
        id: "body-wood.mahogany",
        code: "mahogany",
        name: "Mahogany",
        active: true,
        compatibility: {
          instrumentTypeIds: ["bass"],
          seriesIds: ["headless"],
        },
      },
    ],
  },
  {
    id: "pickup-config",
    step: 4,
    options: [{
      id: "pickup-config.hh",
      code: "hh",
      name: "HH",
      active: true,
      compatibility: {
        instrumentTypeIds: ["electric-guitar"],
        seriesIds: ["headless"],
        shapeIds: ["offset", "t-style"],
      },
    }],
  },
  {
    id: "finish-type",
    step: 5,
    options: [{
      id: "finish-type.nitro",
      code: "nitro",
      name: "Nitro",
      active: true,
      compatibility: {
        instrumentTypeIds: ["electric-guitar"],
        shapeIds: ["offset"],
      },
    }],
  },
];

const modern = {
  id: "body-shape.modern-double-cutaway",
  code: "modern-double-cutaway",
  name: "Modern Double Cutaway",
  active: true,
};

test("later groups that accept Body Shape compatibility are the only ADD TO ALL targets", () => {
  assert.equal(followingGroupIds("body-shape", categories).includes("instrument-type"), false);
  assert.equal(followingGroupIds("body-shape", categories).includes("series"), false);
  const ids = groupsUsingBodyShapeCompatibility(categories).map((item) => item.id);
  assert.equal(ids.includes("series"), false);
  assert.equal(ids.includes("body-shape"), false);
  assert.equal(ids.includes("body-wood"), true);
  assert.equal(ids.includes("pickup-config"), true);
  assert.equal(ids.includes("finish-type"), true);
});

test("ADD TO ALL CONFIG appends the shape to existing lists without duplicates or empty-list writes", () => {
  assert.equal(mergeShapeIntoExistingList([], modern), null);
  assert.equal(mergeShapeIntoExistingList(["modern-double-cutaway"], modern), null);
  assert.deepEqual(mergeShapeIntoExistingList(["offset"], modern), ["offset", "modern-double-cutaway"]);

  const updates = addToAllConfigUpdates(categories, modern);
  assert.deepEqual(updates.map((item) => item.option.code).sort(), ["alder", "hh", "nitro"]);

  const alder = updates.find((item) => item.option.code === "alder");
  assert.deepEqual(alder.previousShapeIds, ["offset"]);
  assert.deepEqual(alder.shapeIds, ["offset", "modern-double-cutaway"]);
  assert.deepEqual(alder.compatibility.instrumentTypeIds, ["electric-guitar"]);
  assert.deepEqual(alder.compatibility.seriesIds, ["headless"]);
  assert.equal(alder.option.isDefault, true);
  assert.equal(alder.option.sortOrder, 3);

  const mahogany = categories[3].options[1];
  assert.equal(updates.some((item) => item.option.id === mahogany.id), false);
});

test("body shape payloads keep identifiers, image, compatibility, and model3DUrl", () => {
  const option = {
    ...categories[2].options[0],
    translations: { en: { name: "Offset", description: "Classic" }, vi: { name: "Offset", description: "Cổ điển" } },
    attributes: { wizardId: "offset", model3DUrl: "/uploads/models/offset.glb" },
    model3DUrl: "/uploads/models/offset.glb",
    sortOrder: 2,
  };
  const form = formFromWizardOption(option, "body-shape", categories);
  assert.equal(form.model3DUrl, "/uploads/models/offset.glb");
  assert.equal(form.imagePath, "/uploads/categories/offset.png");
  assert.deepEqual(form.compatibility.seriesIds, ["headless"]);

  const created = buildWizardOptionCreatePayload({
    ...form,
    code: "modern-double-cutaway",
    enName: "Modern Double Cutaway",
    viName: "Modern Double Cutaway",
    model3DUrl: "/uploads/models/mdc.glb",
  }, { canScopeDefault: true, instrumentTypes: categories[0].options, categories });
  assert.equal(created.code, "modern-double-cutaway");
  assert.equal(created.model3DUrl, "/uploads/models/mdc.glb");
  assert.equal(created.attributes.model3DUrl, "/uploads/models/mdc.glb");
  assert.deepEqual(created.compatibility.instrumentTypeIds, ["electric-guitar"]);

  const cleared = buildWizardOptionUpdatePayload({
    ...form,
    model3DUrl: "",
  }, { canScopeDefault: true, instrumentTypes: categories[0].options, categories });
  assert.equal(Object.hasOwn(cleared, "code"), false);
  assert.equal(cleared.model3DUrl, "");
  assert.equal(cleared.attributes.model3DUrl, "");
  assert.equal(cleared.imagePath, "/uploads/categories/offset.png");
  assert.deepEqual(cleared.compatibility.seriesIds, ["headless"]);
  assert.equal(cleared.sortOrder, 2);
});

test("clearing a GLB path does not keep a non-glb leftover, and public catalog exposes model3DUrl", () => {
  assert.equal(wizardOptionModel3DUrl({ attributes: { modelPath: "/uploads/shape.jpg" } }), "");
  assert.equal(
    wizardOptionModel3DUrl({ model3DUrl: "/uploads/models/mdc.glb" }),
    "/uploads/models/mdc.glb",
  );
  assert.equal(isGlbPath("/uploads/models/mdc.glb"), true);
  assert.equal(isGlbPath("/uploads/models/mdc.jpg"), false);
  assert.equal(storedFileName("/uploads/models/folder/mdc.glb?v=1"), "mdc.glb");

  const lists = listsFromPublicCatalog({
    categories: [{
      id: "body-shape",
      options: [{
        id: "body-shape.mdc",
        code: "mdc",
        name: "MDC",
        active: true,
        model3DUrl: "/uploads/models/mdc.glb",
        imagePath: "/uploads/categories/mdc.png",
      }],
    }],
  });
  assert.equal(lists.shapes[0].model3DUrl, "/uploads/models/mdc.glb");
  assert.equal(lists.shapes[0].image, "/uploads/categories/mdc.png");
});
