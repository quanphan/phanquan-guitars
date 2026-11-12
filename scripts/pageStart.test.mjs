import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

test("page-start is a shared navbar-to-content token and home does not use it", () => {
  const css = read("../src/index.css");
  assert.match(css, /\.page-start/);
  assert.match(css, /\.page-follow/);
  assert.match(css, /\.page-end/);
  assert.match(css, /\.section-y/);
  assert.match(css, /padding-top: 2\.5rem/);
  assert.match(css, /padding-top: 3rem/);
  assert.match(css, /padding-bottom: 4rem/);
  assert.match(css, /padding-block: 4rem/);
  const home = read("../src/pages/Home.jsx");
  const hero = read("../src/components/home/Hero.jsx");
  const featured = read("../src/components/home/FeaturedGuitars.jsx");
  for (const source of [home, hero]) {
    assert.doesNotMatch(source, /page-start/);
    assert.doesNotMatch(source, /page-follow/);
    assert.doesNotMatch(source, /page-end/);
  }
  assert.doesNotMatch(featured, /page-start/);
  assert.match(featured, /section-y/);
  assert.doesNotMatch(read("../src/components/Layout.jsx"), /page-start/);
});

test("guitars listing bands reuse section-y instead of stacked py-24/32", () => {
  const collection = read("../src/pages/Guitars.jsx");
  assert.doesNotMatch(collection, /pb-24 lg:pb-32/);
  assert.match(read("../src/components/guitars/CustomOptions.jsx"), /section-y/);
  assert.match(read("../src/components/guitars/GuitarsProcess.jsx"), /section-y/);
  assert.match(read("../src/components/guitars/GuitarsCta.jsx"), /section-y/);
  assert.doesNotMatch(read("../src/components/guitars/CustomOptions.jsx"), /py-24/);
  const inStock = read("../src/pages/InStock.jsx");
  assert.match(inStock, /page-follow/);
  assert.match(inStock, /page-end/);
  const serviceDetail = read("../src/pages/ServiceCategory.jsx");
  assert.match(serviceDetail, /page-follow/);
  assert.match(serviceDetail, /page-end/);
  assert.doesNotMatch(serviceDetail, /pt-12/);
});

test("public first-content surfaces reuse page-start instead of one-off top padding", () => {
  const header = read("../src/components/PageHeader.jsx");
  assert.match(header, /page-start/);
  assert.doesNotMatch(header, /pt-16/);
  assert.doesNotMatch(header, /lg:pt-20/);
  assert.match(header, /eyebrow \? "mt-4 /);

  const files = [
    "../src/components/guitars/GuitarSeriesSection.jsx",
    "../src/pages/GuitarDetail.jsx",
    "../src/pages/StockDetail.jsx",
    "../src/pages/SeriesDetail.jsx",
    "../src/pages/Contact.jsx",
    "../src/components/page-content/PageContentRenderer.jsx",
  ];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /page-start/, file);
  }
  assert.match(read("../src/components/page-content/PageContentRenderer.jsx"), /lead=\{index === 0\}/);
});
