import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductListQuery,
  buildProductPayload,
  buildTermPayload,
  catalogParentLabel,
  catalogTermDescription,
  catalogTermName,
  catalogTermShortDescription,
  descendantIds,
  filterTerms,
  indexCatalogTerms,
  moveId,
  parentChoices,
  readCatalogId,
  resolvesExternalParents,
  slugifyName,
  usesParentField,
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
  assert.equal(catalogParentLabel(types[0], byId, "vi"), "Guitars");
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

test("term payload writes a shared name into both locales and keeps separate descriptions", () => {
  assert.equal(buildTermPayload({ name: "", slug: "" }).ok, false);
  const next = buildTermPayload({
    name: "Offset",
    slug: "offset",
    isActive: true,
    sortOrder: 2,
    parentId: "",
    imagePath: "/uploads/categories/a.png",
    viDescription: "Dáng offset",
    enDescription: "Offset silhouette",
  });
  assert.equal(next.ok, true);
  assert.equal(next.body.parentId, null);
  assert.equal(next.body.description, undefined);
  assert.equal(next.body.translations.vi.name, "Offset");
  assert.equal(next.body.translations.en.name, "Offset");
  assert.equal(next.body.translations.vi.description, "Dáng offset");
  assert.equal(next.body.translations.en.description, "Offset silhouette");
  const untitled = buildTermPayload({ name: "Strat", sortOrder: 0 });
  assert.equal(untitled.ok, true);
  assert.equal(untitled.body.slug, "strat");
  assert.equal(untitled.body.translations.vi.description, null);
  assert.equal(untitled.body.minPrice, undefined);
  assert.equal(usesParentField("categories"), false);
  assert.equal(usesParentField("series"), true);
});

test("series payload stores bilingual short descriptions and rejects inverted prices", () => {
  const next = buildTermPayload(
    {
      name: "Player",
      slug: "player",
      sortOrder: 0,
      viShortDescription: "Dong dan thuc dung.",
      enShortDescription: "A practical playing instrument.",
      viDescription: "Mo ta VI",
      enDescription: "Full EN",
      minPrice: "800",
      maxPrice: "1500",
      currency: "usd",
    },
    { kind: "series" },
  );
  assert.equal(next.ok, true);
  assert.equal(next.body.shortDescription, undefined);
  assert.equal(next.body.translations.vi.shortDescription, "Dong dan thuc dung.");
  assert.equal(next.body.translations.en.shortDescription, "A practical playing instrument.");
  assert.equal(next.body.translations.vi.description, "Mo ta VI");
  assert.equal(next.body.translations.en.description, "Full EN");
  assert.equal(next.body.minPrice, 800);
  assert.equal(next.body.maxPrice, 1500);
  assert.equal(next.body.currency, "USD");
  const inverted = buildTermPayload(
    { name: "Player", slug: "player", sortOrder: 0, minPrice: "2000", maxPrice: "1000" },
    { kind: "series" },
  );
  assert.equal(inverted.ok, false);
  assert.equal(inverted.errors.minPrice, "invalidRange");
});

test("catalog names prefer the shared name and descriptions follow the selected language", () => {
  const item = {
    name: "Offset",
    description: "Fallback",
    translations: {
      vi: { name: "Dáng offset", description: "Thân lệch trục" },
      en: { name: "Offset body", description: "Offset silhouette" },
    },
  };
  assert.equal(catalogTermName(item, "vi"), "Offset");
  assert.equal(catalogTermName(item, "en"), "Offset");
  assert.equal(catalogTermDescription(item, "vi"), "Thân lệch trục");
  assert.equal(catalogTermDescription(item, "en"), "Offset silhouette");
  assert.equal(
    catalogTermShortDescription(
      {
        shortDescription: "Compact intro",
        translations: {
          vi: { shortDescription: "Gioi thieu ngan" },
          en: { shortDescription: "Short intro" },
        },
      },
      "vi",
    ),
    "Gioi thieu ngan",
  );
  assert.equal(
    catalogTermShortDescription(
      {
        shortDescription: "Compact intro",
        translations: {
          vi: { shortDescription: "Gioi thieu ngan" },
          en: { shortDescription: "Short intro" },
        },
      },
      "en",
    ),
    "Short intro",
  );
  assert.equal(
    catalogTermShortDescription(
      { shortDescription: "Legacy shared intro", translations: { vi: {}, en: {} } },
      "vi",
    ),
    "Legacy shared intro",
  );
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
  assert.equal(tFor("en", "admin.catalog.sections.settings"), "Catalog settings");
  assert.equal(tFor("en", "admin.catalog.fields.viDescription"), "Description (Vietnamese)");
  assert.equal(tFor("vi", "admin.catalog.errors.IN_USE"), "Mục này vẫn được sản phẩm hoặc mục con dùng, nên chưa xóa.");
});
