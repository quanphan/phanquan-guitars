import { requestJson } from "./apiClient.js";
import { CATALOG_KINDS } from "../auth/catalog.js";

function failure(result) {
  if (result.network) return { ok: false, code: "NETWORK", items: [] };
  return { ok: false, code: result.payload?.error?.code || "failure", items: [] };
}

export async function listPublicProducts(productType) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  const typeQuery =
    productType === "custom-order" || productType === "ready-stock"
      ? `&productType=${encodeURIComponent(productType)}`
      : "";
  do {
    const result = await requestJson(`/api/products?page=${page}&limit=50&sort=manual${typeQuery}`);
    if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
      return { ...failure(result), items: [] };
    }
    items.push(...result.payload.data);
    totalPages = Number(result.payload.meta?.totalPages) || 1;
    page += 1;
  } while (page <= totalPages && page <= 20);
  return { ok: true, code: null, items };
}

export async function getPublicProduct(id) {
  const result = await requestJson(`/api/products/${encodeURIComponent(id)}`);
  if (result.ok && result.payload?.success === true && result.payload.data?.id) {
    return { ok: true, code: null, item: result.payload.data };
  }
  const listed = await listPublicProducts();
  if (listed.ok) {
    const item = listed.items.find((product) => product.id === id || product.slug === id);
    if (item) return { ok: true, code: null, item };
  }
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", item: null };
  return { ...failure(result), item: null };
}

export function catalogNamesFromProducts(items) {
  const names = {};
  for (const item of items || []) {
    for (const rel of [item.category, item.instrumentType, item.bodyShape, item.series]) {
      if (rel?.id && rel?.name) names[rel.id] = rel.name;
    }
  }
  return names;
}

export async function loadCatalogNameMap(products = []) {
  const names = catalogNamesFromProducts(products);
  const results = await Promise.all(
    CATALOG_KINDS.map((kind) => requestJson(`/api/catalog/${kind}`)),
  );
  for (const result of results) {
    if (!result.ok || !Array.isArray(result.payload?.data)) continue;
    for (const item of result.payload.data) {
      if (item?.id && item?.name) names[item.id] = item.name;
    }
  }
  return names;
}
