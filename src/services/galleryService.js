import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";
import { GALLERY_CATEGORIES } from "../data/gallery.js";

const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

function failure(result, fallback = "failure") {
  if (result.network) return { ok: false, code: "NETWORK", status: result.status };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401 };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403 };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404 };
  if (result.status === 413) return { ok: false, code: "PAYLOAD_TOO_LARGE", status: 413 };
  if (result.status === 415) return { ok: false, code: "UNSUPPORTED_MEDIA_TYPE", status: 415 };
  return {
    ok: false,
    code: result.payload?.error?.code || fallback,
    status: result.status,
    details: result.payload?.error?.details,
  };
}

export async function listPublicGallery({ category, page = 1, limit = 50 } = {}) {
  if (!isCustomBuildApiConfigured()) {
    return { ok: false, code: "UNAVAILABLE", items: [], meta: null };
  }
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (GALLERY_CATEGORIES.includes(category)) params.set("category", category);
  const result = await requestJson(`/api/gallery?${params.toString()}`);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [], meta: null };
  }
  return { ok: true, code: null, items: result.payload.data, meta: result.payload.meta ?? null };
}

export async function listAdminGallery(request, { category, status, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (GALLERY_CATEGORIES.includes(category)) params.set("category", category);
  if (status === "draft" || status === "published") params.set("status", status);
  const result = await request(`/api/admin/gallery?${params.toString()}`);
  if (!result.ok || result.payload?.success !== true || !Array.isArray(result.payload.data)) {
    return { ...failure(result), items: [], meta: null };
  }
  return { ok: true, code: null, items: result.payload.data, meta: result.payload.meta ?? null };
}

export async function saveGalleryPost(request, payload, id) {
  const path = id ? `/api/admin/gallery/${encodeURIComponent(id)}` : "/api/admin/gallery";
  const result = await request(path, { method: id ? "PATCH" : "POST", body: payload });
  if (!result.ok || result.payload?.success !== true || !result.payload.data) {
    const detail = result.payload?.error?.details?.[0]?.code;
    const mapped = ["TOO_MANY_IMAGES", "TOO_MANY_VIDEOS", "MIXED_MEDIA"].includes(detail)
      ? { ...failure(result), code: detail, post: null }
      : { ...failure(result), post: null };
    return mapped;
  }
  return { ok: true, code: null, post: result.payload.data };
}

export async function deleteGalleryPost(request, id) {
  const result = await request(`/api/admin/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!result.ok || result.payload?.success !== true) return failure(result);
  return { ok: true, code: null };
}

export async function uploadGalleryMedia(formRequest, file) {
  if (!(file instanceof File)) return { ok: false, code: "BAD_REQUEST", media: null };
  const isVideo = file.type.startsWith("video/");
  if (isVideo && file.size > VIDEO_MAX) return { ok: false, code: "PAYLOAD_TOO_LARGE", media: null };
  if (!isVideo && file.size > IMAGE_MAX) return { ok: false, code: "PAYLOAD_TOO_LARGE", media: null };
  const formData = new FormData();
  formData.append("file", file);
  const result = await formRequest("/api/admin/gallery/uploads", { method: "POST", formData });
  if (!result.ok || result.payload?.success !== true || !result.payload.data?.path) {
    return { ...failure(result), media: null };
  }
  return { ok: true, code: null, media: result.payload.data };
}

export { IMAGE_MAX, VIDEO_MAX };
