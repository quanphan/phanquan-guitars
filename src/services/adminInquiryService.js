import { INQUIRY_STATUSES, buildInquiryListQuery } from "./inquiryQuery.js";

function failure(result, fallback = "failure") {
  if (result.network) return { ok: false, code: "NETWORK", status: result.status };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401 };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403 };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404 };
  if (result.status === 400) return { ok: false, code: "BAD_REQUEST", status: 400 };
  if (result.status === 422) return { ok: false, code: "VALIDATION", status: 422 };
  return { ok: false, code: result.payload?.error?.code || fallback, status: result.status };
}

export async function listAdminInquiries(request, filters) {
  const query = buildInquiryListQuery(filters);
  const path = query
    ? `/api/admin/custom-build/inquiries?${query}`
    : "/api/admin/custom-build/inquiries";
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

export async function getAdminInquiry(request, id) {
  const result = await request(`/api/admin/custom-build/inquiries/${encodeURIComponent(id)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), inquiry: null };
  }
  return { ok: true, code: null, inquiry: result.payload.data };
}

export async function updateAdminInquiryStatus(request, id, status) {
  if (!INQUIRY_STATUSES.includes(status)) {
    return { ok: false, code: "VALIDATION", inquiry: null };
  }
  const result = await request(`/api/admin/custom-build/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.id) {
    return { ...failure(result), inquiry: null };
  }
  return { ok: true, code: null, inquiry: result.payload.data };
}

export async function deleteAdminInquiry(request, id) {
  const result = await request(`/api/admin/custom-build/inquiries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!result.ok || result.payload?.success !== true || result.payload.data?.deleted !== true) {
    return { ...failure(result), deleted: false };
  }
  return { ok: true, code: null, deleted: true, id: result.payload.data.id };
}

export async function loadInquiryStatusCounts(request, filters) {
  const counts = {};
  const results = await Promise.all(
    INQUIRY_STATUSES.map(async (status) => {
      const listed = await listAdminInquiries(request, {
        ...filters,
        status,
        page: 1,
        limit: 1,
      });
      return [status, listed.ok ? listed.meta?.total ?? 0 : null];
    }),
  );
  let failed = false;
  for (const [status, total] of results) {
    counts[status] = total;
    if (total == null) failed = true;
  }
  return { ok: !failed, counts };
}
