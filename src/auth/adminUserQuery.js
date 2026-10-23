const ROLES = ["customer", "admin", "superadmin"];
const STATUSES = ["active", "locked"];

export function buildUserListQuery({ q, role, status, page, limit } = {}) {
  const params = new URLSearchParams();
  const search = typeof q === "string" ? q.trim() : "";
  if (search) params.set("q", search.slice(0, 80));
  if (role && ROLES.includes(role)) params.set("role", role);
  if (status && STATUSES.includes(status)) params.set("status", status);
  if (Number.isInteger(page) && page > 0) params.set("page", String(page));
  if (Number.isInteger(limit) && limit > 0) params.set("limit", String(limit));
  return params.toString();
}

export { ROLES as USER_ROLES, STATUSES as USER_STATUSES };
