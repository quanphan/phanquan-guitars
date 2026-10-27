import { isCustomBuildApiConfigured } from "../config/api.js";
import { requestJson } from "./apiClient.js";

function failure(result, fallback = "failure") {
  const message = result.payload?.error?.details?.[0]?.message || result.payload?.error?.message;
  if (result.network) return { ok: false, code: result.status === 0 ? "NETWORK" : "NETWORK", status: result.status, message };
  if (result.status === 401) return { ok: false, code: "UNAUTHORIZED", status: 401, message };
  if (result.status === 403) return { ok: false, code: "FORBIDDEN", status: 403, message };
  if (result.status === 404) return { ok: false, code: "NOT_FOUND", status: 404, message };
  if (result.status === 409) {
    return {
      ok: false,
      code: result.payload?.error?.details?.[0]?.code || "CONFLICT",
      status: 409,
      details: result.payload?.error?.details,
      references: result.payload?.error?.details?.[0]?.references,
      message,
    };
  }
  if (result.status >= 500) {
    return { ok: false, code: result.payload?.error?.code || "SERVER_ERROR", status: result.status, message };
  }
  return {
    ok: false,
    code: result.payload?.error?.code || fallback,
    status: result.status,
    details: result.payload?.error?.details,
    message,
  };
}

function logSetup(event, detail) {
  if (!import.meta.env?.DEV) return;
  console.info("[wizard-setup]", event, detail);
}

export async function listWizardSetup(request) {
  const result = await request("/api/admin/custom-build/setup");
  if (!result.ok || result.payload?.success !== true) return { ...failure(result), categories: [] };
  return { ok: true, categories: result.payload.data?.categories || [] };
}

export async function getWizardCategory(request, categoryId) {
  const result = await request(`/api/admin/custom-build/setup/${encodeURIComponent(categoryId)}`);
  if (!result.ok || result.payload?.success !== true) return { ...failure(result), category: null };
  return { ok: true, category: result.payload.data };
}

export async function createWizardOption(request, categoryId, body) {
  const result = await request(`/api/admin/custom-build/setup/${encodeURIComponent(categoryId)}/options`, {
    method: "POST",
    body,
  });
  if (!result.ok || result.payload?.success !== true) return { ...failure(result), option: null };
  return { ok: true, option: result.payload.data };
}

export async function updateWizardOption(request, categoryId, optionId, body) {
  const result = await request(
    `/api/admin/custom-build/setup/${encodeURIComponent(categoryId)}/options/${encodeURIComponent(optionId)}`,
    { method: "PATCH", body },
  );
  if (!result.ok || result.payload?.success !== true) return { ...failure(result), option: null };
  return { ok: true, option: result.payload.data };
}

export async function duplicateWizardOption(request, categoryId, optionId) {
  const result = await request(
    `/api/admin/custom-build/setup/${encodeURIComponent(categoryId)}/options/${encodeURIComponent(optionId)}/duplicate`,
    { method: "POST" },
  );
  if (!result.ok || result.payload?.success !== true) return { ...failure(result), option: null };
  return { ok: true, option: result.payload.data };
}

export async function deleteWizardOption(request, categoryId, optionId) {
  logSetup("delete-request", { categoryId, optionId });
  const result = await request(
    `/api/admin/custom-build/setup/${encodeURIComponent(categoryId)}/options/${encodeURIComponent(optionId)}`,
    { method: "DELETE" },
  );
  if (!result.ok || result.payload?.success !== true || result.payload?.data?.deleted !== true) {
    const failed = failure(result);
    logSetup("delete-result", { categoryId, optionId, status: result.status, code: failed.code });
    return failed;
  }
  logSetup("delete-result", { categoryId, optionId, status: result.status, deleted: true });
  return { ok: true, id: result.payload.data.id };
}

export const BLOCKED_DELETE_CODES = ["IN_USE", "LAST_OPTION"];

export function canStartExclusiveAction(busy) {
  return !busy;
}

export function isBlockedDelete(error) {
  return Boolean(error && BLOCKED_DELETE_CODES.includes(error.code));
}

export function blockedDeleteBody(localize, error) {
  const text = localize(error?.code) || error?.message || localize("failure");
  const names = (error?.references || [])
    .map((item) => item?.name || item?.id)
    .filter(Boolean)
    .slice(0, 6);
  if (!names.length) return text;
  return `${text} ${names.join(", ")}`;
}

export async function fetchPublicWizardCatalog() {
  if (!isCustomBuildApiConfigured()) return { ok: false, catalog: null, reason: "unconfigured" };
  const result = await requestJson("/api/custom-build/options");
  if (!result.ok || result.payload?.success !== true) {
    return { ok: false, catalog: null, reason: result.network ? "unavailable" : "invalid" };
  }
  return { ok: true, catalog: result.payload.data };
}
