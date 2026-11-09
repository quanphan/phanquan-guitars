import { slugifyName } from "../auth/catalog.js";

export function usesSeriesNameAutocomplete(stepId, categoryId) {
  return String(stepId) === "1" && categoryId === "series";
}

export function seriesCatalogSuggestions(items) {
  return (items || [])
    .filter((item) => item?.id && item.isActive !== false)
    .map((item) => {
      const enName = String(item.translations?.en?.name || item.name || "").trim();
      const viName = String(item.translations?.vi?.name || "").trim();
      const slug = String(item.slug || "").trim();
      return {
        id: String(item.id),
        enName,
        viName,
        slug,
      };
    })
    .filter((item) => item.enName);
}

export function filterSeriesCatalogSuggestions(items, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return items || [];
  return (items || []).filter((item) => {
    const hay = `${item.enName} ${item.viName} ${item.slug}`.toLowerCase();
    return hay.includes(q);
  });
}

export function seriesSuggestionFormValues(item, { includeCode = true } = {}) {
  if (!item) return null;
  const values = {
    enName: item.enName || "",
    viName: item.viName || "",
  };
  if (includeCode) {
    values.code = item.slug || slugifyName(item.enName || item.viName);
  }
  return values;
}

export function nextSuggestionIndex(current, count, direction) {
  if (!count) return -1;
  if (current < 0) return direction > 0 ? 0 : count - 1;
  return (current + direction + count) % count;
}
