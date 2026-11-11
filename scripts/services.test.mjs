import assert from "node:assert/strict";
import test from "node:test";
import { PRIMARY_NAV_LINKS } from "../src/data/nav.js";
import {
  FALLBACK_SERVICE_CATEGORIES,
  mergePublicCategories,
  optionGroupsFromItem,
  resolveServiceItemPrice,
  serviceCardImageFit,
} from "../src/data/services.js";
import { tFor } from "../src/i18n/translations.js";
import { safeServiceHtml } from "../src/data/services.js";

test("Services sits immediately after In Stock in the primary nav", () => {
  const paths = PRIMARY_NAV_LINKS.map((link) => link.to);
  assert.equal(paths.indexOf("/services"), paths.indexOf("/in-stock") + 1);
  assert.equal(tFor("en", "nav.services"), "Services");
  assert.equal(tFor("vi", "nav.services"), "Dịch vụ");
});

test("Services listing has three bilingual categories and Details/Contact labels", () => {
  assert.deepEqual(
    FALLBACK_SERVICE_CATEGORIES.map((item) => item.slug),
    ["guitar-repair", "tools-equipment", "3d-design-cnc"],
  );
  assert.equal(FALLBACK_SERVICE_CATEGORIES[0].linkMode, "details");
  assert.equal(FALLBACK_SERVICE_CATEGORIES[1].linkMode, "details");
  assert.equal(FALLBACK_SERVICE_CATEGORIES[2].linkMode, "contact");
  assert.equal(tFor("en", "services.details"), "Details");
  assert.equal(tFor("vi", "services.details"), "Chi tiết");
  assert.equal(tFor("en", "services.contact"), "Contact");
  assert.equal(tFor("en", "admin.tabs.services"), "Services");
  assert.equal(tFor("en", "services.expertise.title"), "Workshop Expertise");
  assert.equal(tFor("vi", "services.expertise.title"), "Năng lực xưởng");
  assert.equal(tFor("en", "services.howWeWork.title"), "How We Work");
  assert.equal(tFor("en", "services.howWeWork.steps").length, 4);
  assert.equal(tFor("en", "services.howWeWork.steps")[0].title, "Discuss the requirements.");
  assert.equal(
    tFor("vi", "services.howWeWork.steps")[0].title,
    "Trao đổi và tìm hiểu nhu cầu của khách hàng.",
  );
  assert.equal(tFor("vi", "services.howWeWork.steps")[1].title, "Đánh giá và đề xuất giải pháp phù hợp.");
  assert.equal(tFor("vi", "services.howWeWork.steps")[2].title, "Thống nhất phạm vi công việc và báo giá.");
  assert.equal(tFor("vi", "services.howWeWork.steps")[3].title, "Tiến hành thực hiện công việc.");
  const empty = mergePublicCategories([]);
  assert.equal(empty.length, 3);
  const fromApi = mergePublicCategories([
    { slug: "guitar-repair", sortOrder: 1, linkMode: "details" },
    { slug: "custom-jigs", sortOrder: 0, linkMode: "details" },
  ]);
  assert.equal(fromApi[0].slug, "custom-jigs");
  assert.equal(fromApi.length, 2);
});

test("service HTML display strips script tags", () => {
  assert.equal(safeServiceHtml("<p>Ok</p><script>alert(1)</script>").includes("script"), false);
});

test("service item prices use combination, then a single value override, then the default", () => {
  const item = {
    price: 50,
    optionGroups: [
      {
        id: "g-length",
        values: [
          { id: "v-8", price: null },
          { id: "v-12", price: 55 },
        ],
      },
      {
        id: "g-radius",
        values: [
          { id: "v-9", price: null },
          { id: "v-16", price: null },
        ],
      },
    ],
    variantPrices: [{ valueIds: ["v-12", "v-16"], price: 70 }],
  };
  assert.equal(resolveServiceItemPrice(item, ["v-8", "v-9"]), 50);
  assert.equal(resolveServiceItemPrice(item, ["v-12", "v-9"]), 55);
  assert.equal(resolveServiceItemPrice(item, ["v-12", "v-16"]), 70);
  assert.equal(resolveServiceItemPrice({ price: 40, optionGroups: [] }, []), 40);
});

test("service item cards cover landscape and square photos, and contain portraits", () => {
  assert.equal(serviceCardImageFit(1600, 900), "cover");
  assert.equal(serviceCardImageFit(1200, 1200), "cover");
  assert.equal(serviceCardImageFit(800, 1200), "contain");
  assert.equal(serviceCardImageFit(0, 10), "cover");
  assert.equal(tFor("en", "cart.priceOnRequest"), "Price on Request");
  assert.equal(tFor("vi", "cart.priceOnRequest"), "Giá liên hệ");
});

test("copying a service item remaps option ids and keeps combination prices", () => {
  const copied = optionGroupsFromItem({
    optionGroups: [
      { id: "g1", translations: { en: { name: "Radius" } }, values: [{ id: "v1", translations: { en: { label: '12"' } } }] },
    ],
    variantPrices: [{ valueIds: ["v1"], price: 12 }],
  }, { remapIds: true });
  assert.notEqual(copied.optionGroups[0].id, "g1");
  assert.notEqual(copied.optionGroups[0].values[0].id, "v1");
  assert.equal(copied.variantPrices[0].valueIds[0], copied.optionGroups[0].values[0].id);
  assert.equal(tFor("en", "admin.services.copyNew"), "Copy & New");
  assert.equal(tFor("vi", "admin.services.copyNew"), "Sao chép & tạo mới");
});
