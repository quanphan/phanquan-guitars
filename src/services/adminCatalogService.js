import { buildProductListQuery } from "../auth/catalog.js";

function failure(result, fallback = "failure") {
  const details = result.payload?.error?.details;
  const message = result.payload?.error?.message || "";
  if (result.network) return { ok: false, code: "NETWORK", status: 0, details, message };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401, details, message };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403, details, message };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404, details, message };
  if (result.status === 409) {
    const linked = /linked|child/i.test(message);
    const slug = /slug/i.test(message);
    return {
      ok: false,
      code: linked ? "IN_USE" : slug ? "SLUG_CONFLICT" : "CONFLICT",
      status: 409,
      details,
      message,
    };
  }
  if (result.status === 413) return { ok: false, code: "PAYLOAD_TOO_LARGE", status: 413, details, message };
  if (result.status === 415) return { ok: false, code: "UNSUPPORTED_MEDIA_TYPE", status: 415, details, message };
  if (result.status === 400) return { ok: false, code: "BAD_REQUEST", status: 400, details, message };
  if (result.status === 422) return { ok: false, code: "VALIDATION", status: 422, details, message };
  return {
    ok: false,
    code: result.payload?.error?.code || fallback,
    status: result.status,
    details,
    message,
  };
}

export async function listCatalogTerms(request, kind) {
  const result = await request(`/api/admin/catalog/${kind}`);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [] };
  }
  return { ok: true, code: null, items: result.payload.data };
}

export async function getCatalogTerm(request, kind, id) {
  const result = await request(`/api/admin/catalog/${kind}/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function createCatalogTerm(request, kind, body) {
  const result = await request(`/api/admin/catalog/${kind}`, { method: "POST", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function updateCatalogTerm(request, kind, id, body) {
  const result = await request(`/api/admin/catalog/${kind}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function reorderCatalogTerms(request, kind, ids) {
  const result = await request(`/api/admin/catalog/${kind}/reorder`, {
    method: "PATCH",
    body: { ids },
  });
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [] };
  }
  return { ok: true, code: null, items: result.payload.data };
}

export async function deleteCatalogTerm(request, kind, id) {
  const result = await request(`/api/admin/catalog/${kind}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true || result.payload.data?.deleted !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, code: null, deleted: true, id: result.payload.data.id };
}

export async function listAdminCatalogProducts(request, filters) {
  const query = buildProductListQuery(filters);
  const path = query ? `/api/admin/catalog/products?${query}` : "/api/admin/catalog/products";
  const result = await request(path);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [], meta: null };
  }
  return {
    ok: true,
    code: null,
    items: result.payload.data,
    meta: result.payload.meta ?? null,
  };
}

export async function getAdminCatalogProduct(request, id) {
  const result = await request(`/api/admin/catalog/products/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function createAdminCatalogProduct(request, body) {
  const result = await request("/api/admin/catalog/products", { method: "POST", body });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function updateAdminCatalogProduct(request, id, body) {
  const result = await request(`/api/admin/catalog/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), item: null };
  }
  return { ok: true, code: null, item: result.payload.data };
}

export async function reorderAdminCatalogProducts(request, ids) {
  const result = await request("/api/admin/catalog/products/reorder", {
    method: "PATCH",
    body: { ids },
  });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result);
  }
  return { ok: true, code: null };
}

export async function deleteAdminProduct(request, id) {
  const result = await request(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true || result.payload.data?.deleted !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, code: null, deleted: true };
}

export async function uploadAdminImage(formRequest, { file, scope }) {
  if (!(file instanceof File)) {
    return { ok: false, code: "BAD_REQUEST", path: null };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, code: "PAYLOAD_TOO_LARGE", path: null };
  }
  const formData = new FormData();
  formData.append("file", file);
  const result = await formRequest(`/api/admin/uploads?scope=${encodeURIComponent(scope)}`, {
    method: "POST",
    formData,
  });
  const path = result.payload?.data?.path || result.payload?.data?.url;
  if (!result.ok || result.payload?.success !== true || typeof path !== "string") {
    return { ...failure(result), path: null };
  }
  return { ok: true, code: null, path };
}
