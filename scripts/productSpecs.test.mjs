import assert from "node:assert/strict";
import test from "node:test";
import {
  combinedPickupText,
  copyFormFromProduct,
  mergeProductSpecs,
  PRODUCT_TYPES,
  productsOfType,
  readProductType,
  specsToForm,
  specsToTabs,
} from "../src/auth/productSpecs.js";

test("copy form keeps specs and images but not id, sku, qty, or published status", () => {
  const form = copyFormFromProduct({
    id: "abc123",
    slug: "original-slug",
    name: "PQH7",
    code: "SKU-1",
    productType: "custom-order",
    status: "published",
    sortOrder: 9,
    qty: 4,
    inventory: { quantity: 4 },
    image: "/uploads/guitars/a.png",
    images: ["/uploads/guitars/a.png"],
    description: "Short",
    specs: { bodyWood: "Ash", stringCount: "7" },
    category: { id: "cat1" },
  });
  assert.equal(form.name, "PQH7");
  assert.equal(form.image, "/uploads/guitars/a.png");
  assert.equal(form.bodyWood, "Ash");
  assert.equal(form.productType, "custom-order");
  assert.equal(form.status, "draft");
  assert.equal(form.sortOrder, 0);
  assert.equal(form.code, "");
  assert.equal(form.qty, "");
  assert.equal(form.id, undefined);
  assert.equal(form.slug, undefined);
});

test("readProductType does not guess from qty or legacy type", () => {
  assert.equal(readProductType({ qty: 3, type: "Electric Guitar" }), null);
  assert.equal(readProductType({ productType: "custom-order" }), PRODUCT_TYPES.CUSTOM_ORDER);
  assert.equal(readProductType({ specs: { productType: "ready-stock" } }), PRODUCT_TYPES.READY_STOCK);
});

test("public lists keep custom-order and ready-stock apart and skip unclassified products", () => {
  const catalog = [
    { id: "c1", productType: "custom-order", qty: 0 },
    { id: "r1", specs: { productType: "ready-stock" }, qty: 0 },
    { id: "u1", qty: 8, type: "Electric Guitar" },
  ];
  assert.deepEqual(
    productsOfType(catalog, PRODUCT_TYPES.CUSTOM_ORDER).map((item) => item.id),
    ["c1"],
  );
  assert.deepEqual(
    productsOfType(catalog, PRODUCT_TYPES.READY_STOCK).map((item) => item.id),
    ["r1"],
  );
});

test("mergeProductSpecs preserves unknown keys and keeps product type off specs", () => {
  const next = mergeProductSpecs(
    { mystery: "keep me", bodyWood: "old", productType: "custom-order" },
    { bodyWood: "Ash", topWood: "" },
  );
  assert.equal(next.mystery, "keep me");
  assert.equal(next.bodyWood, "Ash");
  assert.equal(next.topWood, undefined);
  assert.equal(next.productType, undefined);
});

test("combined pickup text keeps a saved configuration and appends leftover pickup parts", () => {
  assert.equal(
    combinedPickupText({
      pickupConfiguration: "HH",
      neckPickup: "Seymour Duncan '59",
      bridgePickup: "Seymour Duncan JB",
    }),
    "HH\nNeck: Seymour Duncan '59\nBridge: Seymour Duncan JB",
  );
  assert.equal(
    combinedPickupText({
      pickupConfiguration: "HH — Bridge: Seymour Duncan JB; Neck: Seymour Duncan '59",
      neckPickup: "Seymour Duncan '59",
    }),
    "HH — Bridge: Seymour Duncan JB; Neck: Seymour Duncan '59",
  );
});

test("form maps hardware brand/finish into hardwareFinish and does not drop pickup parts on merge", () => {
  const form = specsToForm({
    hardwareManufacturerFinish: "Black chrome",
    neckPickup: "P-90",
  });
  assert.equal(form.hardwareFinish, "Black chrome");
  assert.match(form.pickupConfiguration, /P-90/);
  const merged = mergeProductSpecs(
    { neckPickup: "P-90", hardwareManufacturerFinish: "Black chrome" },
    { ...form, pickupConfiguration: "P-90 set", hardwareFinish: "Black chrome" },
  );
  assert.equal(merged.pickupConfiguration, "P-90 set");
  assert.equal(merged.neckPickup, "P-90");
  assert.equal(merged.hardwareFinish, "Black chrome");
});

test("finish form uses finishColor and keeps legacy sheen in specs on merge", () => {
  const form = specsToForm({ colour: "Natural", sheen: "Satin", finishType: "Nitro" });
  assert.equal(form.finishColor, "Natural");
  assert.equal(form.sheen, undefined);
  const merged = mergeProductSpecs({ colour: "Natural", sheen: "Satin", finishType: "Nitro" }, {
    ...form,
    finishColor: "Sunburst",
    finishType: "Nitro",
    inlay: "Dots",
  });
  assert.equal(merged.finishColor, "Sunburst");
  assert.equal(merged.colour, "Sunburst");
  assert.equal(merged.inlay, "Dots");
  assert.equal(merged.sheen, "Satin");
});

test("specsToTabs maps catalog ids and hides empty or raw id keys", () => {
  const tabs = specsToTabs(
    {
      bodyWood: "64b8f2a1c3d4e5f678901234",
      "finish-color.natural": "skip",
      neckWoodId: "also-skip",
      colour: "Natural",
      sheen: "Satin",
    },
    { "64b8f2a1c3d4e5f678901234": "Swamp ash" },
  );
  assert.equal(tabs.body.bodyWood, "Swamp ash");
  assert.equal(tabs.finish.colour, "Natural");
  assert.equal(tabs.finish.sheen, undefined);
  assert.equal(tabs.body.neckWoodId, undefined);
});
