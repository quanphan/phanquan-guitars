import assert from "node:assert/strict";
import test from "node:test";
import {
  filterSeriesCatalogSuggestions,
  nextSuggestionIndex,
  seriesCatalogSuggestions,
  seriesSuggestionFormValues,
  usesSeriesNameAutocomplete,
} from "../src/data/wizardSeriesSuggestions.js";
import { tFor } from "../src/i18n/translations.js";

const boutique = {
  id: "6addb32aaa8faa407deee7fb",
  isActive: true,
  slug: "pq-boutique-series",
  name: "PQ-BOUTIQUE SERIES",
  translations: {
    en: { name: "PQ-BOUTIQUE SERIES" },
    vi: { name: "Dòng Boutique" },
  },
};

const player = {
  id: "player",
  isActive: true,
  slug: "pq-player-series",
  name: "PQ-PLAYER SERIES",
  translations: {
    en: { name: "PQ-PLAYER SERIES" },
    vi: { name: "PQ-PLAYER SERIES" },
  },
};

const inactive = {
  id: "hidden",
  isActive: false,
  slug: "hidden",
  name: "Hidden",
  translations: { en: { name: "Hidden" }, vi: { name: "Ẩn" } },
};

test("series name autocomplete is limited to Instrument & Shape / Series", () => {
  assert.equal(usesSeriesNameAutocomplete("1", "series"), true);
  assert.equal(usesSeriesNameAutocomplete(1, "series"), true);
  assert.equal(usesSeriesNameAutocomplete("1", "instrument-type"), false);
  assert.equal(usesSeriesNameAutocomplete("2", "series"), false);
});

test("catalog suggestions use active series names and slugs without inventing records", () => {
  const items = seriesCatalogSuggestions([boutique, player, inactive, { id: "blank" }]);
  assert.deepEqual(
    items.map((item) => item.id),
    [boutique.id, player.id],
  );
  assert.equal(items[0].enName, "PQ-BOUTIQUE SERIES");
  assert.equal(items[0].viName, "Dòng Boutique");
  assert.equal(items[0].slug, "pq-boutique-series");
});

test("series suggestions filter with case-insensitive partial matching", () => {
  const items = seriesCatalogSuggestions([boutique, player]);
  assert.equal(filterSeriesCatalogSuggestions(items, "").length, 2);
  assert.deepEqual(
    filterSeriesCatalogSuggestions(items, "bout").map((item) => item.id),
    [boutique.id],
  );
  assert.deepEqual(
    filterSeriesCatalogSuggestions(items, "PLAYER").map((item) => item.id),
    [player.id],
  );
  assert.deepEqual(
    filterSeriesCatalogSuggestions(items, "dòng").map((item) => item.id),
    [boutique.id],
  );
  assert.equal(filterSeriesCatalogSuggestions(items, "zzzz").length, 0);
});

test("selecting a series maps catalog fields onto the option form", () => {
  const values = seriesSuggestionFormValues(seriesCatalogSuggestions([boutique])[0]);
  assert.deepEqual(values, {
    enName: "PQ-BOUTIQUE SERIES",
    viName: "Dòng Boutique",
    code: "pq-boutique-series",
  });
  const namesOnly = seriesSuggestionFormValues(seriesCatalogSuggestions([boutique])[0], { includeCode: false });
  assert.deepEqual(namesOnly, {
    enName: "PQ-BOUTIQUE SERIES",
    viName: "Dòng Boutique",
  });
});

test("keyboard highlight wraps through the filtered list", () => {
  assert.equal(nextSuggestionIndex(-1, 3, 1), 0);
  assert.equal(nextSuggestionIndex(2, 3, 1), 0);
  assert.equal(nextSuggestionIndex(0, 3, -1), 2);
  assert.equal(nextSuggestionIndex(0, 0, 1), -1);
});

test("series suggestion copy exists in English and Vietnamese", () => {
  assert.equal(tFor("en", "admin.wizardSetup.noSeriesMatch").includes("keep this name"), true);
  assert.equal(tFor("vi", "admin.wizardSetup.noSeriesMatch").includes("giữ tên"), true);
});
