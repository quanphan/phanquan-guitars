import { publicUser } from "../auth/session.js";
import { buildUserListQuery } from "../auth/adminUserQuery.js";

function failure(result, fallback = "failure") {
  const details = result.payload?.error?.details;
  if (result.network) return { ok: false, code: "NETWORK", status: result.status, details };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401, details };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403, details };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404, details };
  if (result.status === 409) return { ok: false, code: "CONFLICT", status: 409, details };
  if (result.status === 400) return { ok: false, code: "BAD_REQUEST", status: 400, details };
  if (result.status === 422) return { ok: false, code: "VALIDATION", status: 422, details };
  return {
    ok: false,
    code: result.payload?.error?.code || fallback,
    status: result.status,
    details,
  };
}

function asUser(payload) {
  const raw = payload?.success === true ? payload.data : null;
  return publicUser(raw);
}

export async function listAdminUsers(request, filters) {
  const query = buildUserListQuery(filters);
  const path = query ? `/api/admin/users?${query}` : "/api/admin/users";
  const result = await request(path);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [], meta: null };
  }
  return {
    ok: true,
    code: null,
    items: result.payload.data.map((item) => publicUser(item)).filter((item) => item?.id),
    meta: result.payload.meta ?? null,
  };
}

export async function getAdminUser(request, id) {
  const result = await request(`/api/admin/users/${encodeURIComponent(id)}`);
  const user = asUser(result.payload);
  if (!result.ok || !user?.id) return { ...failure(result), user: null };
  return { ok: true, code: null, user };
}

export async function createAdminUser(request, body) {
  const result = await request("/api/admin/users/admins", { method: "POST", body });
  const user = asUser(result.payload);
  if (!result.ok || !user?.id) return { ...failure(result), user: null };
  return { ok: true, code: null, user };
}

export async function updateAdminUserRole(request, id, body) {
  const result = await request(`/api/admin/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body,
  });
  const user = asUser(result.payload);
  if (!result.ok || !user?.id) return { ...failure(result), user: null };
  return { ok: true, code: null, user };
}

export async function updateAdminUserStatus(request, id, status) {
  const result = await request(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
  const user = asUser(result.payload);
  if (!result.ok || !user?.id) return { ...failure(result), user: null };
  return { ok: true, code: null, user };
}
