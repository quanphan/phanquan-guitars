export const PRODUCT_IMAGE_MAX = 5;

export const PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.jpg,.jpeg,.png,.webp,.heic,.heif";

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const DIRECT_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function productImageFileKey(file) {
  if (!file) return "";
  return `${file.name || ""}:${file.size || 0}:${file.lastModified || 0}`;
}

export function isHeicLike(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  return HEIC_TYPES.has(type) || name.endsWith(".heic") || name.endsWith(".heif");
}

export function validateProductImageFile(file) {
  if (!file) return "BAD_REQUEST";
  if (file.size > 5 * 1024 * 1024) return "PAYLOAD_TOO_LARGE";
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const allowedName = /\.(jpe?g|png|webp|heic|heif)$/i.test(name);
  if (type && !DIRECT_TYPES.has(type) && !HEIC_TYPES.has(type) && !allowedName) {
    return "UNSUPPORTED_MEDIA_TYPE";
  }
  if (!type && !allowedName) return "UNSUPPORTED_MEDIA_TYPE";
  return null;
}

function replaceExtension(name, ext) {
  const base = String(name || "image").replace(/\.[^.]+$/, "");
  return `${base || "image"}${ext}`;
}

export async function fileForProductUpload(file) {
  const invalid = validateProductImageFile(file);
  if (invalid) return { ok: false, code: invalid, file: null };
  if (!isHeicLike(file)) return { ok: true, code: null, file };

  try {
    const module = await import("heic2any");
    const convert = module.default || module;
    let result = await convert({ blob: file, toType: "image/jpeg", quality: 0.9 });
    if (Array.isArray(result)) result = result[0];
    if (!(result instanceof Blob)) return { ok: false, code: "HEIC_CONVERT", file: null };
    const jpeg = new File([result], replaceExtension(file.name, ".jpg"), { type: "image/jpeg" });
    return { ok: true, code: null, file: jpeg };
  } catch {
    return { ok: false, code: "HEIC_CONVERT", file: null };
  }
}

export function takeProductImageFiles(fileList, currentCount, seenKeys = new Set()) {
  const selected = Array.from(fileList || []);
  const available = Math.max(0, PRODUCT_IMAGE_MAX - currentCount);
  if (!selected.length) {
    return { files: [], skipped: true, overflow: false, invalidCode: null, duplicateOnly: false };
  }
  if (available <= 0) {
    return { files: [], skipped: true, overflow: true, invalidCode: null, duplicateOnly: false };
  }
  const files = [];
  const keys = new Set(seenKeys);
  let invalidCode = null;
  let skippedDuplicate = 0;
  for (const file of selected) {
    if (files.length >= available) break;
    const invalid = validateProductImageFile(file);
    if (invalid) {
      invalidCode = invalid;
      continue;
    }
    const key = productImageFileKey(file);
    if (!key || keys.has(key)) {
      skippedDuplicate += 1;
      continue;
    }
    keys.add(key);
    files.push(file);
  }
  return {
    files,
    skipped: files.length === 0,
    overflow: selected.length > files.length && currentCount + files.length >= PRODUCT_IMAGE_MAX,
    invalidCode,
    duplicateOnly: files.length === 0 && skippedDuplicate > 0 && !invalidCode,
  };
}

export function uniqueImagePaths(paths, max = PRODUCT_IMAGE_MAX) {
  const seen = new Set();
  const next = [];
  for (const item of paths || []) {
    const path = typeof item === "string" ? item.trim() : "";
    if (!path || seen.has(path)) continue;
    seen.add(path);
    next.push(path);
    if (next.length >= max) break;
  }
  return next;
}

export function imageFileName(path, fallback = "") {
  if (typeof path !== "string" || !path) return fallback;
  const cleaned = path.split("?")[0];
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] || fallback;
}
