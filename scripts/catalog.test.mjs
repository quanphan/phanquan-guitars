import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductListQuery,
  buildProductPayload,
  buildTermPayload,
  catalogParentLabel,
  descendantIds,
  filterTerms,
  indexCatalogTerms,
  moveId,
  parentChoices,
  readCatalogId,
  resolvesExternalParents,
  slugifyName,
} from "../src/auth/catalog.js";
import { tFor } from "../src/i18n/translations.js";
import { ADMIN_ASSIGNABLE, PERMISSIONS } from "../src/auth/permissions.js";

test("slugify strips vietnamese marks and enforces slug charset", () => {
  assert.equal(slugifyName("Đàn Strat Cổ điển"), "dan-strat-co-dien");
  assert.equal(slugifyName("  Tele / Offset  "), "tele-offset");
});

test("instrument types, body shapes and series resolve parents outside their own list", () => {
  assert.equal(resolvesExternalParents("instrument-types"), true);
  assert.equal(resolvesExternalParents("body-shapes"), true);
  assert.equal(resolvesExternalParents("series"), true);
  assert.equal(resolvesExternalParents("categories"), false);
});

test("instrument type parent labels resolve category ids and populated objects", () => {
  const categories = [{ id: "cat1", name: "Guitars", translations: { vi: { name: "Guitar" } } }];
  const types = [
    { id: "type1", name: "Electric", parentId: "cat1" },
    { id: "type2", name: "Bass", parentId: { $oid: "cat1" } },
    { id: "type3", name: "Headless", parent: { id: "cat1", name: "Guitars" } },
    { id: "type4", name: "Custom", parentId: null },
  ];
  const byId = indexCatalogTerms([...categories, ...types]);
  assert.equal(readCatalogId({ $oid: "cat1" }), "cat1");
  assert.equal(catalogParentLabel(types[0], byId, "en"), "Guitars");
  assert.equal(catalogParentLabel(types[0], byId, "vi"), "Guitar");
  assert.equal(catalogParentLabel(types[1], byId, "en"), "Guitars");
  assert.equal(catalogParentLabel(types[2], byId, "en"), "Guitars");
  assert.equal(catalogParentLabel(types[3], byId, "en"), "");
});

test("parent choices exclude self and descendants", () => {
  const items = [
    { id: "a", parentId: null },
    { id: "b", parentId: "a" },
    { id: "c", parentId: "b" },
    { id: "d", parentId: null },
  ];
  assert.deepEqual([...descendantIds(items, "a")], ["b", "c"]);
  assert.deepEqual(parentChoices(items, "a").map((item) => item.id), ["d"]);
  assert.deepEqual(parentChoices(items, "d").map((item) => item.id), ["a", "b", "c"]);
});

test("term payload omits empty translations and requires name/slug", () => {
  assert.equal(buildTermPayload({ name: "", slug: "" }).ok, false);
  const next = buildTermPayload({
    name: "Offset",
    slug: "offset",
    isActive: true,
    sortOrder: 2,
    parentId: "",
    imagePath: "/uploads/categories/a.png",
    viName: "Dáng offset",
  });
  assert.equal(next.ok, true);
  assert.equal(next.body.parentId, null);
  assert.equal(next.body.translations.vi.name, "Dáng offset");
  assert.equal(next.body.translations.en, undefined);
});

test("product list query uses backend search and status names", () => {
  const query = buildProductListQuery({ search: "strat", status: "draft", page: 1, limit: 10 });
  assert.equal(query.includes("search=strat"), true);
  assert.equal(query.includes("status=draft"), true);
  assert.equal(query.includes("sort=manual"), true);
  assert.equal(query.includes("q="), false);
});

test("product payload requires product type and omits legacy slug/type/brand", () => {
  assert.equal(buildProductPayload({ name: "PQ T Custom", sortOrder: 0 }).ok, false);
  const next = buildProductPayload({
    name: "PQ T Custom",
    productType: "custom-order",
    slug: "pq-t-custom",
    type: "Electric Guitar",
    brand: "PhanQuan",
    qty: 1,
    sortOrder: 0,
    status: "published",
    image: "/uploads/guitars/a.png",
    images: ["/uploads/guitars/a.png"],
    categoryId: "",
    specs: { productType: "custom-order", bodyWood: "Ash" },
  });
  assert.equal(next.ok, true);
  assert.equal(next.body.productType, "custom-order");
  assert.equal(next.body.type, undefined);
  assert.equal(next.body.brand, undefined);
  assert.equal(next.body.slug, undefined);
  assert.equal(next.body.qty, 1);
  assert.equal(next.body.image, "/uploads/guitars/a.png");
  assert.equal(next.body.categoryId, null);
  assert.equal(next.body.specs.productType, undefined);
  assert.equal(next.body.specs.bodyWood, "Ash");
});

test("reorder helper swaps adjacent ids only", () => {
  assert.deepEqual(moveId(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.equal(moveId(["a", "b"], "a", -1), null);
});

test("inactive filter hides disabled terms without inventing rows", () => {
  const items = [
    { id: "1", name: "Bass", slug: "bass", isActive: true },
    { id: "2", name: "Parts", slug: "parts", isActive: false },
  ];
  assert.equal(filterTerms(items, { status: "inactive" }).map((item) => item.id).join(), "2");
  assert.equal(filterTerms(items, { q: "bass" }).length, 1);
});

test("frontend permissions include catalog and uploads from the backend contract", () => {
  assert.equal(PERMISSIONS.includes("catalog.read"), true);
  assert.equal(ADMIN_ASSIGNABLE.includes("uploads.write"), true);
  assert.equal(tFor("en", "admin.tabs.catalog"), "Catalog");
  assert.equal(tFor("vi", "admin.catalog.errors.IN_USE"), "Mục này vẫn được sản phẩm hoặc mục con dùng, nên chưa xóa.");
});
