function failure(result, fallback = "failure") {
  if (result.network) return { ok: false, code: "NETWORK", status: result.status };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401 };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403 };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404 };
  return { ok: false, code: result.payload?.error?.code || fallback, status: result.status };
}

export async function listAdminMessages(request, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (Number.isInteger(page) && page > 0) params.set("page", String(page));
  if (Number.isInteger(limit) && limit > 0) params.set("limit", String(limit));
  const query = params.toString();
  const path = query ? `/api/admin/messages?${query}` : "/api/admin/messages";
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

export async function getAdminMessage(request, id) {
  const result = await request(`/api/admin/messages/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), message: null };
  }
  return { ok: true, code: null, message: result.payload.data };
}

export async function deleteAdminMessage(request, id) {
  const result = await request(`/api/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!result.ok || result.payload?.success !== true) {
    return failure(result);
  }
  return { ok: true, code: null };
}
