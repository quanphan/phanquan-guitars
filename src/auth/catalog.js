export const CATALOG_KINDS = [
  "categories",
  "instrument-types",
  "body-shapes",
  "series",
];

export const PARENT_KIND_SOURCES = {
  categories: ["categories"],
  "instrument-types": ["categories", "instrument-types"],
  "body-shapes": ["categories", "instrument-types"],
  series: ["categories", "instrument-types", "series"],
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isCatalogKind(kind) {
  return CATALOG_KINDS.includes(kind);
}

export function resolvesExternalParents(kind) {
  return (PARENT_KIND_SOURCES[kind] || []).some((source) => source !== kind);
}

export function slugifyName(name) {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug;
}

export function isValidSlug(slug) {
  return SLUG_PATTERN.test(slug) && slug.length > 0 && slug.length <= 80;
}

export function descendantIds(items, rootId) {
  const blocked = new Set();
  if (!rootId) return blocked;
  const byParent = new Map();
  for (const item of items) {
    const parentId = item.parentId || "";
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(item.id);
  }
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop();
    for (const child of byParent.get(current) || []) {
      if (!blocked.has(child)) {
        blocked.add(child);
        stack.push(child);
      }
    }
  }
  return blocked;
}

export function parentChoices(items, currentId) {
  const blocked = descendantIds(items, currentId);
  if (currentId) blocked.add(currentId);
  return items.filter((item) => item?.id && !blocked.has(item.id));
}

export function readCatalogId(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value !== "object") return "";
  if (typeof value.$oid === "string") return value.$oid;
  if (typeof value.id === "string" || typeof value.id === "number") return String(value.id);
  if (typeof value._id === "string" || typeof value._id === "number") return String(value._id);
  if (value._id && typeof value._id === "object" && typeof value._id.$oid === "string") return value._id.$oid;
  if (typeof value.toHexString === "function") return value.toHexString();
  return "";
}

export function catalogTermName(item, language) {
  if (!item || typeof item !== "object") return "";
  if (typeof item.name === "string" && item.name.trim()) return item.name.trim();
  const translated = language ? item.translations?.[language]?.name : "";
  if (typeof translated === "string" && translated.trim()) return translated.trim();
  const other = language === "vi" ? item.translations?.en?.name : item.translations?.vi?.name;
  if (typeof other === "string" && other.trim()) return other.trim();
  return "";
}

export function catalogTermDescription(item, language) {
  if (!item || typeof item !== "object") return "";
  const translated = language ? item.translations?.[language]?.description : "";
  if (typeof translated === "string" && translated.trim()) return translated.trim();
  if (typeof item.description === "string" && item.description.trim()) return item.description.trim();
  return "";
}

export function catalogTermShortDescription(item, language) {
  if (!item || typeof item !== "object") return "";
  const translated = language ? item.translations?.[language]?.shortDescription : "";
  if (typeof translated === "string" && translated.trim()) return translated.trim();
  if (typeof item.shortDescription === "string" && item.shortDescription.trim()) {
    return item.shortDescription.trim();
  }
  const other = language === "vi" ? item.translations?.en?.shortDescription : item.translations?.vi?.shortDescription;
  if (typeof other === "string" && other.trim()) return other.trim();
  return "";
}

export function usesParentField(kind) {
  return kind !== "categories";
}

export function catalogParentLabel(item, byId, language) {
  const populated = item?.parent;
  if (populated && typeof populated === "object" && !Array.isArray(populated)) {
    const named = catalogTermName(populated, language);
    if (named) return named;
  }
  const parentId = readCatalogId(item?.parentId ?? item?.parent);
  if (!parentId) return "";
  const parent = byId instanceof Map ? byId.get(parentId) : null;
  return catalogTermName(parent, language);
}

function indexCatalogTerms(items) {
  const byId = new Map();
  for (const item of items || []) {
    const id = readCatalogId(item);
    if (id) byId.set(id, item);
  }
  return byId;
}

export { indexCatalogTerms };

export function moveId(ids, id, direction) {
  const next = ids.slice();
  const index = next.indexOf(id);
  const swapWith = index + direction;
  if (index < 0 || swapWith < 0 || swapWith >= next.length) return null;
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return next;
}

export function filterTerms(items, { q = "", status = "" } = {}) {
  const search = q.trim().toLowerCase();
  return items.filter((item) => {
    if (status === "active" && item.isActive === false) return false;
    if (status === "inactive" && item.isActive !== false) return false;
    if (!search) return true;
    const haystack = [
      item.name,
      item.slug,
      item.translations?.vi?.name,
      item.translations?.en?.name,
      item.translations?.vi?.description,
      item.translations?.en?.description,
      item.translations?.vi?.shortDescription,
      item.translations?.en?.shortDescription,
      item.description,
      item.shortDescription,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function localeBlock(name, description, shortDescription) {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  const trimmedShort = typeof shortDescription === "string" ? shortDescription.trim() : "";
  const block = {
    name: trimmedName || null,
    description: trimmedDescription || null,
  };
  if (shortDescription !== undefined) {
    block.shortDescription = trimmedShort || null;
  }
  return block;
}

function readOptionalPrice(value) {
  if (value === "" || value == null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return { error: "invalid" };
  return amount;
}

export function buildTermPayload(form, { includeImagePath = true, kind } = {}) {
  const errors = {};
  const name = typeof form.name === "string" ? form.name.trim() : "";
  const providedSlug = typeof form.slug === "string" ? form.slug.trim().toLowerCase() : "";
  const slug = providedSlug || slugifyName(name);
  if (!name) errors.name = "required";
  else if (name.length > 120) errors.name = "tooLong";
  if (!slug) errors.slug = "required";
  else if (!isValidSlug(slug)) errors.slug = "invalidSlug";

  const viDescription = typeof form.viDescription === "string" ? form.viDescription.trim() : "";
  const enDescription = typeof form.enDescription === "string" ? form.enDescription.trim() : "";
  const viShortDescription = typeof form.viShortDescription === "string" ? form.viShortDescription.trim() : "";
  const enShortDescription = typeof form.enShortDescription === "string" ? form.enShortDescription.trim() : "";
  if (viDescription.length > 500) errors.viDescription = "tooLong";
  if (enDescription.length > 500) errors.enDescription = "tooLong";
  if (viShortDescription.length > 200) errors.viShortDescription = "tooLong";
  if (enShortDescription.length > 200) errors.enShortDescription = "tooLong";

  const sortOrder = Number(form.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    errors.sortOrder = "invalid";
  }

  const isSeries = kind === "series";
  let minPrice = null;
  let maxPrice = null;
  let currency = null;
  if (isSeries) {
    minPrice = readOptionalPrice(form.minPrice);
    maxPrice = readOptionalPrice(form.maxPrice);
    if (minPrice && typeof minPrice === "object") errors.minPrice = minPrice.error;
    if (maxPrice && typeof maxPrice === "object") errors.maxPrice = maxPrice.error;
    if (typeof minPrice === "number" && typeof maxPrice === "number" && minPrice > maxPrice) {
      errors.minPrice = "invalidRange";
      errors.maxPrice = "invalidRange";
    }
    const rawCurrency = typeof form.currency === "string" ? form.currency.trim().toUpperCase() : "";
    currency = rawCurrency || "USD";
    if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "invalid";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors, body: null };
  }

  const body = {
    name,
    slug,
    isActive: form.isActive !== false,
    sortOrder,
    translations: {
      vi: localeBlock(name, viDescription, isSeries ? viShortDescription : undefined),
      en: localeBlock(name, enDescription, isSeries ? enShortDescription : undefined),
    },
  };
  if (form.parentId) body.parentId = form.parentId;
  else body.parentId = null;

  if (includeImagePath && form.imagePath !== undefined) {
    body.imagePath = form.imagePath || null;
  }

  if (isSeries) {
    body.minPrice = typeof minPrice === "number" ? minPrice : null;
    body.maxPrice = typeof maxPrice === "number" ? maxPrice : null;
    body.currency = currency;
  }

  return { ok: true, errors: {}, body };
}

export function buildProductListQuery({ search, status, page, limit } = {}) {
  const params = new URLSearchParams();
  const q = typeof search === "string" ? search.trim().slice(0, 80) : "";
  if (q) params.set("search", q);
  if (status === "draft" || status === "published") params.set("status", status);
  params.set("sort", "manual");
  if (Number.isInteger(page) && page > 0) params.set("page", String(page));
  if (Number.isInteger(limit) && limit > 0) params.set("limit", String(limit));
  return params.toString();
}

export function buildProductPayload(form) {
  const errors = {};
  const name = typeof form.name === "string" ? form.name.trim() : "";
  if (!name) errors.name = "required";

  if (form.productType !== "custom-order" && form.productType !== "ready-stock") {
    errors.productType = "required";
  }

  const qty = form.qty === "" || form.qty == null ? null : Number(form.qty);
  if (qty != null && (!Number.isInteger(qty) || qty < 0)) errors.qty = "invalid";

  const sortOrder = Number(form.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    errors.sortOrder = "invalid";
  }

  if (form.status && form.status !== "draft" && form.status !== "published") {
    errors.status = "invalid";
  }

  const price = form.price === "" || form.price == null ? null : Number(form.price);
  if (price != null && (!Number.isFinite(price) || price < 0)) errors.price = "invalid";

  if (Object.keys(errors).length) {
    return { ok: false, errors, body: null };
  }

  const body = {
    name,
    sortOrder,
    status: form.status === "draft" ? "draft" : "published",
    productType: form.productType,
  };
  if (form.code !== undefined) body.code = String(form.code || "").trim() || null;
  if (form.description !== undefined) body.description = String(form.description || "").trim() || null;
  if (form.descriptionDetail !== undefined) {
    body.descriptionDetail = String(form.descriptionDetail || "").trim() || null;
  }
  if (qty != null) body.qty = qty;
  if (price != null) body.price = price;
  if (form.unit !== undefined) body.unit = String(form.unit || "").trim() || null;
  if (form.image !== undefined) body.image = form.image || null;
  if (Array.isArray(form.images)) body.images = form.images.filter(Boolean);
  body.categoryId = form.categoryId || null;
  body.instrumentTypeId = form.instrumentTypeId || null;
  body.bodyShapeId = form.bodyShapeId || null;
  body.seriesId = form.seriesId || null;
  if (form.specs && typeof form.specs === "object" && !Array.isArray(form.specs)) {
    const specs = { ...form.specs };
    delete specs.productType;
    body.specs = specs;
  }
  return { ok: true, errors: {}, body };
}
