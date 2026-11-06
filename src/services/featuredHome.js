import { seriesCardCopy } from "./guitarSeries.js";

export function toFeaturedSeriesCard(item, language) {
  const card = seriesCardCopy(item, language);
  if (!card.id || !card.href) return null;
  return card;
}
