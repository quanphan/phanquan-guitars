import { catalogTermDescription, catalogTermName, catalogTermShortDescription, readCatalogId } from "../auth/catalog.js";
import { formatStoredPrice } from "./formatPrice.js";

export function readProductSeriesId(item) {
  if (!item || typeof item !== "object") return "";
  const fromRelation = readCatalogId(item.series);
  if (fromRelation) return fromRelation;
  return readCatalogId(item.seriesId);
}

export function publicCatalogSeries(items) {
  return (items || []).filter((item) => item?.id && item.isActive !== false);
}

export function filterInstrumentsBySeries(items, seriesId) {
  const selected = readCatalogId(seriesId);
  if (!selected) return [...(items || [])];
  return (items || []).filter((item) => readProductSeriesId(item) === selected);
}

export function seriesImagePath(item) {
  const path = typeof item?.imagePath === "string" ? item.imagePath.trim() : "";
  if (!path) return "";
  if (!path.startsWith("/uploads/") && !/^https?:\/\//i.test(path)) return "";
  return path;
}

export function seriesCardCopy(item, language) {
  return {
    id: readCatalogId(item),
    name: catalogTermName(item, language),
    shortDescription: catalogTermShortDescription(item, language),
    description: catalogTermDescription(item, language),
    imagePath: seriesImagePath(item),
    minPrice: item?.minPrice,
    maxPrice: item?.maxPrice,
    currency: item?.currency,
  };
}

export function formatSeriesPriceRange(item, t) {
  const min = Number(item?.minPrice);
  const max = Number(item?.maxPrice);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;
  if (!hasMin && !hasMax) return "";
  const currency = typeof item?.currency === "string" && item.currency.trim() ? item.currency.trim() : "USD";
  const minText = hasMin ? formatStoredPrice(min, currency) : "";
  const maxText = hasMax ? formatStoredPrice(max, currency) : "";
  const code = /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : currency;
  if (hasMin && hasMax) {
    return t("guitars.series.priceFromTo")
      .replace("{min}", minText)
      .replace("{max}", maxText)
      .replace("{currency}", code);
  }
  if (hasMin) {
    return t("guitars.series.priceFrom").replace("{min}", minText).replace("{currency}", code);
  }
  return t("guitars.series.priceUpTo").replace("{max}", maxText).replace("{currency}", code);
}
