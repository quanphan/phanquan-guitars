/** Optional per-series `background-position`. Default is center. */
export const SERIES_CARD_IMAGE_POSITION = {};

export function seriesCardImagePosition(series) {
  if (!series || typeof series !== "object") return "center";
  const keys = [series.slug, series.id, series.imagePath].filter(Boolean);
  for (const key of keys) {
    const value = SERIES_CARD_IMAGE_POSITION[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "center";
}
