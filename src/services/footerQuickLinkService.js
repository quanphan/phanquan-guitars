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

export async function listPublicFooterQuickLinks() {
  if (!isCustomBuildApiConfigured()) {
    return { ok: true, items: [], unavailable: true };
  }
  const result = await requestJson("/api/footer-quick-links");
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result, { items: [] }), unavailable: result.network };
  }
  return { ok: true, items: result.payload.data, unavailable: false };
}

export async function listAdminFooterQuickLinks(request) {
  const result = await request("/api/admin/footer-quick-links");
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function getAdminFooterQuickLink(request, id) {
  const result = await request(`/api/admin/footer-quick-links/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function createAdminFooterQuickLink(request, body) {
  const result = await request("/api/admin/footer-quick-links", { method: "POST", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function updateAdminFooterQuickLink(request, id, body) {
  const result = await request(`/api/admin/footer-quick-links/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result, { item: null });
  }
  return { ok: true, item: result.payload.data };
}

export async function reorderAdminFooterQuickLinks(request, ids) {
  const result = await request("/api/admin/footer-quick-links/reorder", {
    method: "PATCH",
    body: { ids },
  });
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return failure(result, { items: [] });
  }
  return { ok: true, items: result.payload.data };
}

export async function deleteAdminFooterQuickLink(request, id) {
  const result = await request(`/api/admin/footer-quick-links/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, deleted: true };
}
