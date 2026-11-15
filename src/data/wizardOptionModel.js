const GLB_PATH = /\.glb(\?.*)?$/i;
const GLTF_MAGIC = "glTF";
export const GLB_MAX_BYTES = 50 * 1024 * 1024;

function attributesOf(option) {
  return option?.attributes && typeof option.attributes === "object" && !Array.isArray(option.attributes)
    ? option.attributes
    : {};
}

export function isGlbPath(value) {
  return typeof value === "string" && GLB_PATH.test(value.trim());
}

export function storedFileName(path) {
  if (typeof path !== "string") return "";
  const trimmed = path.trim().split("?")[0].split("#")[0];
  if (!trimmed) return "";
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export function wizardOptionModel3DUrl(option) {
  if (!option || typeof option !== "object") return "";
  const attributes = attributesOf(option);
  for (const value of [
    option.model3DUrl,
    option.modelPath,
    option.modelGlb,
    attributes.model3DUrl,
    attributes.modelPath,
    attributes.modelGlb,
  ]) {
    if (isGlbPath(value)) return value.trim();
  }
  return "";
}

export function looksLikeGlbFileName(file) {
  if (!(file instanceof File)) return false;
  return file.name.toLowerCase().endsWith(".glb");
}

export async function fileHasGlbMagic(file) {
  if (!(file instanceof File) || file.size < 4) return false;
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return String.fromCharCode(...bytes) === GLTF_MAGIC;
}

export async function validateGlbFile(file) {
  if (!(file instanceof File)) return { ok: false, code: "INVALID_GLB" };
  if (!looksLikeGlbFileName(file)) return { ok: false, code: "INVALID_GLB" };
  if (file.size > GLB_MAX_BYTES) return { ok: false, code: "PAYLOAD_TOO_LARGE" };
  if (!(await fileHasGlbMagic(file))) return { ok: false, code: "INVALID_GLB" };
  return { ok: true, code: null };
}

export function attributesWithModel3DUrl(attributes, model3DUrl) {
  const next = attributes && typeof attributes === "object" && !Array.isArray(attributes)
    ? { ...attributes }
    : {};
  next.model3DUrl = typeof model3DUrl === "string" ? model3DUrl.trim() : "";
  return next;
}
