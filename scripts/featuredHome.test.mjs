import assert from "node:assert/strict";
import test from "node:test";
import { seriesCardImagePosition } from "../src/data/seriesCardImage.js";
import { toFeaturedSeriesCard } from "../src/services/featuredHome.js";

test("featured cards map series image, short copy, and detail path", () => {
  const card = toFeaturedSeriesCard(
    {
      id: "abc123",
      slug: "pq-boutique-series",
      name: "PQ-BOUTIQUE SERIES",
      showHome: true,
      isActive: true,
      imagePath: "/uploads/categories/boutique.webp",
      translations: {
        en: { shortDescription: "Crafted with character." },
        vi: { shortDescription: "Che tac day ca tinh." },
      },
    },
    "en",
  );
  assert.equal(card.name, "PQ-BOUTIQUE SERIES");
  assert.equal(card.shortDescription, "Crafted with character.");
  assert.equal(card.imagePath, "/uploads/categories/boutique.webp");
  assert.equal(card.href, "/series/pq-boutique-series");
  assert.equal(seriesCardImagePosition(card), "center");
});
