import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PRODUCT_GRID_BREAKPOINTS,
  catalogGridRowDividerAfter,
} from "../src/data/catalogGrid.js";
import { galleryGridRowDividerAfter } from "../src/data/gallery.js";

const root = dirname(fileURLToPath(import.meta.url));

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

test("catalog grid row dividers sit between rows and never after the last row", () => {
  const after = (count, columns) =>
    Array.from({ length: count }, (_, index) => index).filter((index) =>
      catalogGridRowDividerAfter(index, count, columns),
    );
  assert.deepEqual(after(12, 3), [2, 5, 8]);
  assert.deepEqual(after(10, 3), [2, 5, 8]);
  assert.deepEqual(after(12, 2), [1, 3, 5, 7, 9]);
  assert.deepEqual(after(5, 1), [0, 1, 2, 3]);
  assert.deepEqual(after(1, 3), []);
  assert.deepEqual(after(2, 3), []);
  assert.equal(catalogGridRowDividerAfter(11, 12, 3), false);
  assert.equal(galleryGridRowDividerAfter(2, 12, 3), true);
});

test("product grids use md/xl breakpoints matching guitar and service listings", () => {
  assert.deepEqual(
    PRODUCT_GRID_BREAKPOINTS.map((item) => item.cols),
    [1, 2, 3],
  );
  assert.match(PRODUCT_GRID_BREAKPOINTS[1].visible, /md:block/);
  assert.match(PRODUCT_GRID_BREAKPOINTS[2].visible, /xl:block/);
});

test("guitar products and service detail reuse catalog row dividers without applying them to series", () => {
  const guitars = read("../src/pages/Guitars.jsx");
  const services = read("../src/pages/ServiceCategory.jsx");
  const journal = read("../src/pages/Gallery.jsx");
  const series = read("../src/components/guitars/GuitarSeriesSection.jsx");
  const seriesDetail = read("../src/pages/SeriesDetail.jsx");
  for (const source of [guitars, services, journal]) {
    assert.match(source, /CatalogGridRowDividers/);
    assert.match(source, /gap-x-8 gap-y-10/);
  }
  assert.match(guitars, /PRODUCT_GRID_BREAKPOINTS/);
  assert.match(services, /PRODUCT_GRID_BREAKPOINTS/);
  assert.match(journal, /JOURNAL_GRID_BREAKPOINTS/);
  assert.doesNotMatch(series, /CatalogGridRowDividers/);
  assert.doesNotMatch(seriesDetail, /CatalogGridRowDividers/);
});
