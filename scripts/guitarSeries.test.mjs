import assert from "node:assert/strict";
import test from "node:test";
import {
  filterInstrumentsBySeries,
  formatSeriesPriceRange,
  publicCatalogSeries,
  readProductSeriesId,
  seriesCardCopy,
  seriesImagePath,
} from "../src/services/guitarSeries.js";
import { placeSeriesPopover, prefersFinePointer } from "../src/services/seriesPopover.js";
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
  assert.equal(tFor("en", "guitars.series.title"), "Series");
  assert.equal(tFor("en", "guitars.series.readDescription"), "Read full description");
  assert.equal(tFor("vi", "guitars.series.readDescription"), "Xem mô tả đầy đủ");
  assert.equal(tFor("vi", "guitars.series.error").includes("series"), true);
});

test("series description popover stays in the viewport and flips when needed", () => {
  const below = placeSeriesPopover({
    cardRect: { left: 40, top: 80, bottom: 280 },
    viewport: { width: 1280, height: 800 },
  });
  assert.equal(below.placement, "below");
  assert.equal(below.left >= 12, true);
  assert.equal(below.maxWidth <= 420, true);

  const above = placeSeriesPopover({
    cardRect: { left: 40, top: 640, bottom: 780 },
    viewport: { width: 1280, height: 800 },
  });
  assert.equal(above.placement, "above");
  assert.equal(above.top, "auto");
  assert.equal(above.bottom > 12, true);

  const narrow = placeSeriesPopover({
    cardRect: { left: 400, top: 40, bottom: 200 },
    viewport: { width: 360, height: 640 },
  });
  assert.equal(narrow.left + narrow.maxWidth <= 360 - 12, true);
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
