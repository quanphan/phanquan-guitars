import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PRODUCT_PAGE_SIZES,
  compareListingOrder,
  mergeUniqueById,
  parseProductStt,
  PUBLIC_GUITAR_PAGE_SIZE,
  recordRange,
  visiblePageNumbers,
} from "../src/auth/catalog.js";
import { tFor } from "../src/i18n/translations.js";

function sortItems(items) {
  return [...items].sort(compareListingOrder);
}

test("public guitar page size is 10 and admin page sizes are 20/50/100", () => {
  assert.equal(PUBLIC_GUITAR_PAGE_SIZE, 10);
  assert.deepEqual(ADMIN_PRODUCT_PAGE_SIZES, [20, 50, 100]);
});

test("listing order is pin, then STT, then newest createdAt", () => {
  const sorted = sortItems([
    { id: "u-old", pin: false, sortOrder: 1, createdAt: "2022-01-01" },
    { id: "u-new", pin: false, sortOrder: 1, createdAt: "2024-01-01" },
    { id: "p-late", pin: true, sortOrder: 20, createdAt: "2024-06-01" },
    { id: "p-early", pin: true, sortOrder: 2, createdAt: "2020-01-01" },
    { id: "u-missing", pin: false, sortOrder: null, createdAt: "2025-01-01" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["p-early", "p-late", "u-new", "u-old", "u-missing"],
  );
});

test("missing STT sorts after numbered STT in the same pin group without throwing", () => {
  const sorted = sortItems([
    { id: "has", pin: true, sortOrder: 0, createdAt: "2020-01-01" },
    { id: "none", pin: true, createdAt: "2025-01-01" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["has", "none"],
  );
});

test("SHOW MORE appends unique products only", () => {
  const first = Array.from({ length: 10 }, (_, index) => ({ id: `g-${index}` }));
  const second = [
    { id: "g-9" },
    { id: "g-10" },
    { id: "g-11" },
  ];
  const merged = mergeUniqueById(first, second);
  assert.equal(merged.length, 12);
  assert.equal(new Set(merged.map((item) => item.id)).size, 12);
});

test("load-more labels follow the selected site language", () => {
  assert.equal(tFor("en", "guitars.collection.showMore"), "SHOW MORE");
  assert.equal(tFor("vi", "guitars.collection.showMore"), "THÊM NỘI DUNG");
  assert.equal(tFor("en", "guitars.collection.eyebrow"), "FEATURED INSTRUMENTS");
  assert.equal(tFor("en", "guitars.collection.title"), "FEATURED INSTRUMENTS");
  assert.equal(
    tFor("en", "guitars.collection.description"),
    "A selection of distinctive instruments, handcrafted with character and precision.",
  );
  assert.equal(tFor("vi", "guitars.collection.eyebrow"), "SẢN PHẨM TIÊU BIỂU");
  assert.equal(tFor("vi", "guitars.collection.title"), "FEATURED INSTRUMENTS");
  assert.equal(
    tFor("vi", "guitars.collection.description"),
    "Tuyển chọn những nhạc cụ mang dấu ấn thiết kế và chế tác riêng.",
  );
  assert.equal(tFor("en", "gallery.showMore"), "SHOW MORE");
  assert.equal(tFor("vi", "gallery.showMore"), "THÊM NỘI DUNG");
});

test("SHOW MORE is hidden when every product already fits the first page", () => {
  assert.equal(recordRange(1, 10, 8).to, 8);
  assert.equal(recordRange(1, 10, 10).to, 10);
  assert.equal(visiblePageNumbers(1, 1).length, 1);
  const twentyFive = { total: 25, pages: 3 };
  assert.equal(recordRange(1, 10, twentyFive.total).to, 10);
  assert.equal(recordRange(2, 10, twentyFive.total).to, 20);
  assert.equal(recordRange(3, 10, twentyFive.total).to, 25);
});

test("STT parser accepts non-negative integers and rejects the rest", () => {
  assert.deepEqual(parseProductStt("0"), { ok: true, value: 0 });
  assert.deepEqual(parseProductStt(12), { ok: true, value: 12 });
  assert.equal(parseProductStt("-1").ok, false);
  assert.equal(parseProductStt("1.5").ok, false);
  assert.equal(parseProductStt("abc").ok, false);
  assert.equal(parseProductStt("").ok, false);
});
