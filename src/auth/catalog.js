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
  const translated = language ? item.translations?.[language]?.name : "";
  if (typeof translated === "string" && translated.trim()) return translated.trim();
  if (typeof item.name === "string" && item.name.trim()) return item.name.trim();
  return "";
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
    const haystack = [item.name, item.slug, item.translations?.vi?.name, item.translations?.en?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function localeBlock(name, description) {
  const next = {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  if (trimmedName) next.name = trimmedName;
  if (trimmedDescription) next.description = trimmedDescription;
  return Object.keys(next).length ? next : null;
}

export function buildTermPayload(form, { includeImagePath = true } = {}) {
  const errors = {};
  const name = typeof form.name === "string" ? form.name.trim() : "";
  const slug = typeof form.slug === "string" ? form.slug.trim().toLowerCase() : "";
  if (!name) errors.name = "required";
  else if (name.length > 120) errors.name = "tooLong";
  if (!slug) errors.slug = "required";
  else if (!isValidSlug(slug)) errors.slug = "invalidSlug";

  const description = typeof form.description === "string" ? form.description.trim() : "";
  if (description.length > 500) errors.description = "tooLong";

  const sortOrder = Number(form.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    errors.sortOrder = "invalid";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors, body: null };
  }

  const body = {
    name,
    slug,
    isActive: form.isActive !== false,
    sortOrder,
  };
  if (description || form.description === "") body.description = description || null;
  if (form.parentId) body.parentId = form.parentId;
  else body.parentId = null;

  if (includeImagePath && form.imagePath !== undefined) {
    body.imagePath = form.imagePath || null;
  }

  const translations = {};
  const vi = localeBlock(form.viName, form.viDescription);
  const en = localeBlock(form.enName, form.enDescription);
  if (vi) translations.vi = vi;
  if (en) translations.en = en;
  if (Object.keys(translations).length) body.translations = translations;

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
