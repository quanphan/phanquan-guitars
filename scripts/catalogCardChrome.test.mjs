import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { catalogCard } from "../src/components/cards/catalogCardChrome.js";

const root = dirname(fileURLToPath(import.meta.url));

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

test("catalog card chrome has no default border and reserves hover action space", () => {
  assert.match(catalogCard.article, /border-transparent/);
  assert.match(catalogCard.article, /hover:border-gold/);
  assert.doesNotMatch(catalogCard.article, /border-white/);
  assert.match(catalogCard.imageFrame, /aspect-\[16\/9\]/);
  assert.match(catalogCard.title, /line-clamp-2/);
  assert.match(catalogCard.description, /line-clamp-3/);
  assert.match(catalogCard.actionSpacer, /min-h-\[88px\]/);
  assert.match(catalogCard.action, /max-lg:opacity-100/);
  assert.match(catalogCard.action, /opacity-0/);
});

test("home featured and guitar collection cards reuse catalog chrome", () => {
  const home = read("../src/components/home/FeaturedSeriesCard.jsx");
  const collection = read("../src/components/guitars/CollectionCard.jsx");
  const series = read("../src/components/guitars/GuitarSeriesSection.jsx");
  for (const source of [home, collection, series]) {
    assert.match(source, /catalogCard/);
    assert.doesNotMatch(source, /border-white\/8/);
    assert.doesNotMatch(source, /aspect-\[4\/5\]/);
  }
  assert.match(home, /series\.href/);
  assert.match(collection, /CatalogCardCoverImage/);
  assert.doesNotMatch(collection, /FitImage/);
  assert.match(collection, /publicProductHref/);
  assert.match(collection, /layout="product"/);
  assert.match(collection, /mt-5/);
  assert.match(collection, /mt-4/);
  assert.match(collection, /pb-6/);
  assert.doesNotMatch(collection, /viewDetails/);
  assert.doesNotMatch(collection, /actionLabel/);
  assert.doesNotMatch(collection, /min-h-\[88px\]/);
  assert.doesNotMatch(collection, /ArrowRight/);
  assert.match(series, /guitars\.series\.viewDetails/);
  assert.match(home, /home\.featured\.viewSeries/);
});

test("stock, service, and gallery cards reuse catalog chrome without sharing business logic", () => {
  const stock = read("../src/components/stock/StockCard.jsx");
  const service = read("../src/components/services/ServiceItemCard.jsx");
  const gallery = read("../src/components/gallery/GalleryItem.jsx");
  const frame = read("../src/components/cards/CatalogCardFrame.jsx");
  assert.match(frame, /export function CatalogCardShell/);
  assert.match(frame, /export function CatalogCardHoverAction/);
  assert.match(frame, /actionLabel \? \(/);
  for (const source of [stock, service, gallery]) {
    assert.match(source, /catalogCard/);
    assert.doesNotMatch(source, /border-white\/8/);
    assert.doesNotMatch(source, /hover:border-gold\/40/);
  }
  assert.match(stock, /CatalogCardFrame/);
  assert.match(stock, /CatalogCardCoverImage/);
  assert.doesNotMatch(stock, /FitImage/);
  assert.match(stock, /publicProductHref/);
  assert.doesNotMatch(stock, /stock\.viewDetails/);
  assert.doesNotMatch(stock, /actionLabel/);
  assert.doesNotMatch(stock, /min-h-\[88px\]/);
  assert.match(stock, /pb-6/);
  assert.match(stock, /layout="product"/);
  assert.match(stock, /stock\.status/);
  assert.match(service, /CatalogCardShell/);
  assert.match(service, /CatalogCardCoverImage/);
  assert.doesNotMatch(service, /FitImage/);
  assert.doesNotMatch(service, /aspect-\[4\/3\]/);
  assert.match(service, /cart\.priceOnRequest/);
  assert.match(service, /addItem/);
  assert.match(service, /mt-1\.5 line-clamp-2/);
  assert.doesNotMatch(service, /min-h-\[2\.5em\]/);
  assert.doesNotMatch(service, /min-h-\[3\.25em\]/);
  assert.match(service, /flex min-w-0 flex-wrap items-center justify-between/);
  assert.match(service, /ml-auto inline-flex min-h-11 shrink-0/);
  assert.match(service, /border-gold\/70 bg-transparent/);
  assert.match(service, /whitespace-nowrap/);
  assert.doesNotMatch(service, /min-h-12 w-full/);
  assert.doesNotMatch(service, /bg-gold px-4/);
  assert.doesNotMatch(service, /mt-auto/);
  assert.doesNotMatch(service, /max-lg:opacity-100/);
  assert.match(service, /mt-4 space-y-4/);
  assert.doesNotMatch(service, /min-h-\[4\.3rem\]/);
  const servicePage = read("../src/pages/ServiceCategory.jsx");
  assert.doesNotMatch(servicePage, /eyebrow/);
  assert.doesNotMatch(service, /stringsScale/);
  assert.doesNotMatch(service, /CardSpecSummary/);
  assert.match(gallery, /CatalogCardShell/);
  assert.match(gallery, /galleryPostPath/);
  assert.match(gallery, /onPlay/);
  assert.match(gallery, /flushSync/);
  assert.match(gallery, /aspect-\[4\/3\]/);
  assert.match(gallery, /flex w-full shrink-0 flex-col gap-3/);
  assert.match(gallery, /justify-end gap-1\.5 overflow-x-auto px-6/);
  assert.doesNotMatch(gallery, /absolute inset-x-0 bottom-0/);
  assert.match(gallery, /hover:text-gold/);
  assert.match(gallery, /transition-colors duration-300/);
  assert.doesNotMatch(gallery, /gallery\.view/);
  assert.doesNotMatch(gallery, /CatalogCardHoverAction/);
  assert.doesNotMatch(gallery, /actionSpacer/);
  assert.doesNotMatch(gallery, /min-h-\[88px\]/);
  assert.doesNotMatch(gallery, /min-h-\[2\.5em\]/);
  assert.doesNotMatch(gallery, /copy\.excerpt/);
  assert.doesNotMatch(gallery, /min-h-\[4\.3rem\]/);
  const galleryThumb = read("../src/components/gallery/GalleryMediaThumb.jsx");
  assert.match(galleryThumb, /object-contain object-center/);
});
