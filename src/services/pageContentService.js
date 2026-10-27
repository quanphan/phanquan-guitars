import { isCustomBuildApiConfigured } from "../config/api.js";
import { emptyLocale } from "../data/pageContent.js";
import { requestJson } from "./apiClient.js";

function failure(result, fallback = "failure") {
  if (result.network) return { ok: false, code: "NETWORK", status: result.status, document: null };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401, document: null };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403, document: null };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404, document: null };
  if (result.status === 409) return { ok: false, code: "CONFLICT", status: 409, document: null };
  if (result.status === 422) {
    return {
      ok: false,
      code: result.payload?.error?.details?.[0]?.code || "VALIDATION",
      status: 422,
      details: result.payload?.error?.details,
      document: null,
    };
  }
  return {
    ok: false,
    code: result.payload?.error?.code || fallback,
    status: result.status,
    document: null,
  };
}

export async function getPublicPageContent(pageKey) {
  if (!isCustomBuildApiConfigured()) {
    return { ok: true, code: null, document: null, unavailable: true };
  }
  const result = await requestJson(`/api/pages/${encodeURIComponent(pageKey)}`);
  if (!result.ok || result.payload?.success !== true) {
    return { ...failure(result), unavailable: result.network };
  }
  return { ok: true, code: null, document: result.payload.data || null, unavailable: false };
}

export async function getAdminPageContent(request, pageKey) {
  const result = await request(`/api/admin/page-content/${encodeURIComponent(pageKey)}`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result);
  }
  return { ok: true, code: null, document: result.payload.data };
}

export async function previewPageContent(request, pageKey) {
  const result = await request(`/api/admin/page-content/${encodeURIComponent(pageKey)}/preview`);
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result);
  }
  return { ok: true, code: null, document: result.payload.data };
}

export async function savePageContentDraft(request, pageKey, { language, locale, expectedRevision }) {
  const result = await request(`/api/admin/page-content/${encodeURIComponent(pageKey)}/draft`, {
    method: "PUT",
    body: { language, locale, expectedRevision },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result);
  }
  return { ok: true, code: null, document: result.payload.data };
}

export async function publishPageContent(request, pageKey, { expectedRevision }) {
  const result = await request(`/api/admin/page-content/${encodeURIComponent(pageKey)}/publish`, {
    method: "POST",
    body: { expectedRevision },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result);
  }
  return { ok: true, code: null, document: result.payload.data };
}

export async function revertPageContent(request, pageKey, { expectedRevision }) {
  const result = await request(`/api/admin/page-content/${encodeURIComponent(pageKey)}/revert`, {
    method: "POST",
    body: { expectedRevision },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return failure(result);
  }
  return { ok: true, code: null, document: result.payload.data };
}

export function draftLocale(document, language) {
  return document?.draft?.[language] || emptyLocale();
}

export async function listPageImageOrphans(request) {
  const result = await request("/api/admin/page-content/media/orphans");
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return { ...failure(result), listing: null };
  }
  return { ok: true, code: null, listing: result.payload.data };
}

export async function deletePageImageOrphans(request, { paths }) {
  const result = await request("/api/admin/page-content/media/orphans/delete", {
    method: "POST",
    body: { confirm: true, paths },
  });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    return { ...failure(result), listing: null };
  }
  return { ok: true, code: null, listing: result.payload.data };
}
