export const DEFAULT_API_LOCAL = "http://127.0.0.1:5050";
export const DEFAULT_API_RAILWAY = "https://timbowebapi.up.railway.app";
export const DEFAULT_API_DEV_FALLBACK = "http://127.0.0.1:5050";

export function normalizeApiOrigin(value) {
  return String(value ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
}

export function isDevelopmentApiEnv(env = {}) {
  return env.DEV === true || env.MODE === "development";
}

/** Vite proxy target in `npm run dev`. Production builds ignore this. */
export function resolveDevelopmentApiTarget(env = {}) {
  const mode = String(env.VITE_API_MODE ?? "").trim().toLowerCase();
  if (mode === "railway") {
    return normalizeApiOrigin(env.VITE_API_RAILWAY) || DEFAULT_API_RAILWAY;
  }
  if (mode === "local") {
    return normalizeApiOrigin(env.VITE_API_LOCAL) || DEFAULT_API_LOCAL;
  }
  return normalizeApiOrigin(env.VITE_API_BASE_URL) || DEFAULT_API_DEV_FALLBACK;
}

/**
 * Browser API prefix. Development keeps a relative `/api` so Vite can proxy
 * both JSON and `/uploads` to the selected local or Railway origin.
 * Production only honors VITE_API_BASE_URL.
 */
export function resolveApiBaseUrl(env = {}) {
  if (isDevelopmentApiEnv(env)) return "";
  const value = String(env.VITE_API_BASE_URL ?? "").trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

/** Origin used for `/uploads` images, videos, and files. */
export function resolveMediaOrigin(env = {}) {
  if (isDevelopmentApiEnv(env)) return resolveDevelopmentApiTarget(env);
  return normalizeApiOrigin(env.VITE_API_BASE_URL);
}
