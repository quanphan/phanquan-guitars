export const REFERENCE_IMAGE_MAX = 5;
export const REFERENCE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const REFERENCE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const REFERENCE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const STORED_PATH = /^\/uploads\/custom-build\/[a-f0-9]{32}\.(jpg|png|webp)$/i;

export function isStoredReferenceImagePath(value) {
  return typeof value === "string" && STORED_PATH.test(value.trim());
}

export function sanitizeReferenceImages(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const paths = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) continue;
    if (!isStoredReferenceImagePath(trimmed)) continue;
    const normalized = `/uploads/custom-build/${trimmed.slice("/uploads/custom-build/".length).toLowerCase()}`;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    paths.push(normalized);
    if (paths.length >= REFERENCE_IMAGE_MAX) break;
  }
  return paths;
}

export function validateReferenceImageFile(file) {
  if (!file || typeof file !== "object") return { ok: false, code: "INVALID_TYPE" };
  const type = String(file.type || "").toLowerCase();
  if (!REFERENCE_IMAGE_TYPES.has(type)) return { ok: false, code: "INVALID_TYPE" };
  if (Number(file.size) > REFERENCE_IMAGE_MAX_BYTES) return { ok: false, code: "PAYLOAD_TOO_LARGE" };
  return { ok: true, code: null };
}

export function remainingReferenceImageSlots(currentCount) {
  const used = Math.max(0, Number(currentCount) || 0);
  return Math.max(0, REFERENCE_IMAGE_MAX - used);
}
