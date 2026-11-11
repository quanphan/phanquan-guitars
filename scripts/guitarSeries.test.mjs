import assert from "node:assert/strict";
import test from "node:test";
import {
  filterInstrumentsBySeries,
  findPublicSeries,
  formatSeriesPriceRange,
  homeSeries,
  productsInSeries,
  publicCatalogSeries,
  readProductSeriesId,
  seriesCardCopy,
  seriesImagePath,
  seriesPublicPath,
} from "../src/services/guitarSeries.js";
import {
  placeSeriesPopover,
  prefersFinePointer,
  prefersWideSeriesLayout,
  SERIES_POPOVER_MAX_WIDTH,
} from "../src/services/seriesPopover.js";
import { tFor } from "../src/i18n/translations.js";

const essential = "6ad5e9c118f88e7cedd450bf";
const boutique = "6addb32aaa8faa407deee7fb";

test("product series is read from the catalog relation id, not the display name", () => {
  assert.equal(
    readProductSeriesId({
      name: "PQ-ESSENTIAL SERIES",
      series: { id: essential, name: "PQ-ESSENTIAL SERIES" },
    }),
    essential,
  );
  assert.equal(readProductSeriesId({ seriesId: boutique, name: "PQ-BOUTIQUE SERIES" }), boutique);
  assert.equal(readProductSeriesId({ series: { name: essential } }), "");
});

test("featured home series only include active terms with showHome", () => {
  const series = [
    { id: boutique, name: "Boutique", isActive: true, showHome: true, sortOrder: 1 },
    { id: essential, name: "Essential", isActive: true, showHome: true, sortOrder: 2 },
    { id: "off", name: "Off", isActive: true, showHome: false },
    { id: "inactive", name: "Inactive", isActive: false, showHome: true },
  ];
  assert.deepEqual(
    homeSeries(series).map((item) => item.id),
    [boutique, essential],
  );
});

test("series detail routes by slug and lists published products of that series only", () => {
  const series = [
    { id: boutique, slug: "pq-boutique-series", isActive: true, showHome: true },
    { id: essential, slug: "pq-essential-series", isActive: true, showHome: false },
    { id: "hidden", slug: "hidden-line", isActive: false, showHome: true },
  ];
  assert.equal(seriesPublicPath(series[0]), "/series/pq-boutique-series");
  assert.equal(findPublicSeries(series, "pq-essential-series")?.id, essential);
  assert.equal(findPublicSeries(series, "hidden-line"), null);
  const products = [
    { id: "later", seriesId: essential, status: "published", sortOrder: 2 },
    { id: "first", series: { id: essential }, status: "published", sortOrder: 1 },
    { id: "other", seriesId: boutique, status: "published", sortOrder: 0 },
    { id: "draft", seriesId: essential, status: "draft", sortOrder: 0 },
  ];
  assert.deepEqual(
    productsInSeries(products, essential).map((item) => item.id),
    ["first", "later"],
  );
});

test("public catalog series hide inactive terms and keep API order", () => {
  const listed = publicCatalogSeries([
    { id: "a", name: "Player", isActive: true },
    { id: "b", name: "Hidden", isActive: false },
    { id: "c", name: "Boutique" },
  ]);
  assert.deepEqual(
    listed.map((item) => item.id),
    ["a", "c"],
  );
});

test("series filter keeps unmatched guitars for All Series and matches by id", () => {
  const guitars = [
    { id: "pqh7", series: { id: essential, name: "PQ-ESSENTIAL SERIES" } },
    { id: "pqb5", seriesId: essential },
    { id: "unlinked", name: "PQ-ESSENTIAL SERIES" },
  ];
  assert.deepEqual(
    filterInstrumentsBySeries(guitars, "").map((item) => item.id),
    ["pqh7", "pqb5", "unlinked"],
  );
  assert.deepEqual(
    filterInstrumentsBySeries(guitars, essential).map((item) => item.id),
    ["pqh7", "pqb5"],
  );
  assert.deepEqual(filterInstrumentsBySeries(guitars, boutique).map((item) => item.id), []);
});

test("series copy uses the shared name and language-specific description", () => {
  const item = {
    id: essential,
    name: "PQ-ESSENTIAL SERIES",
    imagePath: "/uploads/categories/series.webp",
    translations: {
      vi: { name: "Dòng khác", description: "Mô tả tiếng Việt" },
      en: { name: "Other name", description: "English description" },
    },
  };
  const vi = seriesCardCopy(item, "vi");
  const en = seriesCardCopy(item, "en");
  assert.equal(vi.name, "PQ-ESSENTIAL SERIES");
  assert.equal(en.name, "PQ-ESSENTIAL SERIES");
  assert.equal(vi.description, "Mô tả tiếng Việt");
  assert.equal(en.description, "English description");
  assert.equal(vi.shortDescription, "");
  assert.equal(seriesImagePath(item), "/uploads/categories/series.webp");
  assert.equal(seriesImagePath({ imagePath: "not-a-path" }), "");
  assert.equal(seriesImagePath({}), "");
});

test("public guitar listing filter uses the mapped seriesId field", () => {
  const guitars = [
    { id: "pqh7", seriesId: essential },
    { id: "other", seriesId: boutique },
  ];
  assert.deepEqual(
    filterInstrumentsBySeries(guitars, essential).map((item) => item.id),
    ["pqh7"],
  );
});

test("guitars series copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "seriesDetail.productsTitle"), "Products in this series");
  assert.equal(tFor("vi", "seriesDetail.backGuitars"), "Về trang Guitars");
  assert.equal(tFor("en", "home.featured.viewSeries"), "View series");
  assert.equal(tFor("en", "guitars.series.title"), "Series");
  assert.equal(tFor("en", "guitars.series.readDescription"), "Read full description");
  assert.equal(tFor("vi", "guitars.series.readDescription"), "Xem mô tả đầy đủ");
  assert.equal(tFor("en", "guitars.series.details"), "Details");
  assert.equal(tFor("vi", "guitars.series.details"), "Chi tiết");
  assert.equal(tFor("en", "guitars.series.viewSeries"), "View series");
  assert.equal(tFor("vi", "guitars.series.viewSeries"), "Xem series");
  assert.equal(tFor("en", "guitars.series.next"), "Next series");
  assert.equal(tFor("vi", "guitars.series.previous"), "Series trước");
  assert.equal(tFor("en", "guitars.series.readMore"), "Read more");
  assert.equal(tFor("vi", "guitars.series.showLess"), "Thu gọn");
  assert.equal(tFor("vi", "guitars.series.error").includes("series"), true);
});

test("series description popover stays in the viewport and flips when needed", () => {
  const below = placeSeriesPopover({
    cardRect: { left: 40, top: 80, bottom: 480 },
    viewport: { width: 1280, height: 800 },
  });
  assert.equal(below.placement, "below");
  assert.equal(below.top, 492);
  assert.equal(below.left >= 16, true);
  assert.equal(below.maxWidth <= SERIES_POPOVER_MAX_WIDTH, true);
  assert.equal(below.maxHeight, 292);
  assert.equal(below.maxHeight > 280, true);

  const above = placeSeriesPopover({
    cardRect: { left: 40, top: 640, bottom: 780 },
    viewport: { width: 1280, height: 800 },
  });
  assert.equal(above.placement, "above");
  assert.equal(above.top, "auto");
  assert.equal(above.bottom >= 16, true);
  assert.equal(above.maxHeight, 612);

  const narrow = placeSeriesPopover({
    cardRect: { left: 400, top: 40, bottom: 200 },
    viewport: { width: 360, height: 640 },
  });
  assert.equal(narrow.left >= 16, true);
  assert.equal(narrow.left + narrow.maxWidth <= 360 - 16, true);
  assert.equal(narrow.maxHeight <= 640 - 32, true);
});

test("wide series layout starts at 1024px", () => {
  assert.equal(
    prefersWideSeriesLayout({
      matchMedia: (query) => ({ matches: query.includes("1024") }),
    }),
    true,
  );
  assert.equal(
    prefersWideSeriesLayout({
      matchMedia: () => ({ matches: false }),
    }),
    false,
  );
});

test("series cards use short copy and format configured price ranges only", () => {
  const t = (key) =>
    ({
      "guitars.series.priceFromTo": "From {min} to {max} {currency}",
      "guitars.series.priceFrom": "From {min} {currency}",
      "guitars.series.priceUpTo": "Up to {max} {currency}",
    })[key];
  const item = {
    id: essential,
    name: "PQ-ESSENTIAL SERIES",
    shortDescription: "Core workshop line.",
    translations: {
      vi: { description: "Mo ta dai", shortDescription: "Dong cot loi." },
      en: { description: "Long copy", shortDescription: "Core workshop line." },
    },
    minPrice: 800,
    maxPrice: 1500,
    currency: "USD",
  };
  const card = seriesCardCopy(item, "en");
  const viCard = seriesCardCopy(item, "vi");
  assert.equal(card.shortDescription, "Core workshop line.");
  assert.equal(viCard.shortDescription, "Dong cot loi.");
  assert.equal(card.description, "Long copy");
  assert.equal(viCard.description, "Mo ta dai");
  assert.match(formatSeriesPriceRange(item, t), /From \$800 to \$1,500 USD/);
  assert.match(formatSeriesPriceRange({ minPrice: 800, currency: "USD" }, t), /From \$800 USD/);
  assert.match(formatSeriesPriceRange({ maxPrice: 1500, currency: "USD" }, t), /Up to \$1,500 USD/);
  assert.equal(formatSeriesPriceRange({}, t), "");
  assert.equal(formatSeriesPriceRange({ currency: "USD" }, t), "");
});

test("fine-pointer hover is detected from matchMedia", () => {
  assert.equal(
    prefersFinePointer({
      matchMedia: () => ({ matches: true }),
    }),
    true,
  );
  assert.equal(
    prefersFinePointer({
      matchMedia: () => ({ matches: false }),
    }),
    false,
  );
});
