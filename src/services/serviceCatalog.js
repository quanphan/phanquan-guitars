import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";

function failure(result, extra = {}) {
  if (result.network) return { ok: false, code: "NETWORK", status: 0, ...extra };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401, ...extra };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403, ...extra };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404, ...extra };
  if (result.status === 409) return { ok: false, code: "CONFLICT", status: 409, ...extra };
  if (result.status === 422) {
    return {
      ok: false,
      code: result.payload?.error?.details?.[0]?.code || "VALIDATION",
      status: 422,
      details: result.payload?.error?.details,
      ...extra,
    };
  }
  return {
    ok: false,
    code: result.payload?.error?.code || "failure",
    status: result.status,
    ...extra,
  };
}

export async function listPublicServices() {
  if (!isCustomBuildApiConfigured()) {
    return { ok: true, items: [], unavailable: true };
  }
  const result = await requestJson("/api/services");
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result, { items: [] }), unavailable: result.network };
  }
  return { ok: true, items: result.payload.data, unavailable: false };
}

export async function getPublicServiceCategory(slug) {
  if (!isCustomBuildApiConfigured()) {
    return { ok: false, code: "UNAVAILABLE", category: null, items: [] };
  }
  const result = await requestJson(`/api/services/${encodeURIComponent(slug)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.category) {
    return failure(result, { category: null, items: [] });
  }
  return {
    ok: true,
    category: result.payload.data.category,
    items: Array.isArray(result.payload.data.items) ? result.payload.data.items : [],
  };
}

export async function listAdminServiceCategories(request) {
  const result = await request("/api/admin/services/categories");
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function getAdminServiceCategory(request, id) {
  const result = await request(`/api/admin/services/categories/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function createAdminServiceCategory(request, body) {
  const result = await request("/api/admin/services/categories", { method: "POST", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function updateAdminServiceCategory(request, id, body) {
  const result = await request(`/api/admin/services/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function reorderAdminServiceCategories(request, ids) {
  const result = await request("/api/admin/services/categories/reorder", {
    method: "PATCH",
    body: { ids },
  });
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function deleteAdminServiceCategory(request, id) {
  const result = await request(`/api/admin/services/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, deleted: true };
}

export async function listAdminServiceItems(request, categoryId) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  const result = await request(`/api/admin/services/items${query}`);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function getAdminServiceItem(request, id) {
  const result = await request(`/api/admin/services/items/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function createAdminServiceItem(request, body) {
  const result = await request("/api/admin/services/items", { method: "POST", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function updateAdminServiceItem(request, id, body) {
  const result = await request(`/api/admin/services/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function reorderAdminServiceItems(request, categoryId, ids) {
  const result = await request("/api/admin/services/items/reorder", {
    method: "PATCH",
    body: { categoryId, ids },
  });
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function deleteAdminServiceItem(request, id) {
  const result = await request(`/api/admin/services/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, deleted: true };
}
