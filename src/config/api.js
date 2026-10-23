/**
 * API origin from Vite env. Never hard-code a production host here.
 *
 * Local Vite proxies `/api` to the backend when this is empty.
 * Production builds must set VITE_API_BASE_URL (or an equivalent reverse proxy).
 */
export function getApiBaseUrl() {
  const value = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

export function isCustomBuildApiConfigured() {
  if (getApiBaseUrl()) return true;
  return Boolean(import.meta.env.DEV);
}

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
}

export function isGoogleSignInConfigured() {
  return Boolean(getGoogleClientId());
}

export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, "");
}

export function apiUrl(path) {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Resolve a stored relative upload path without duplicating origin. */
export function mediaUrl(path) {
  if (typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const origin = getApiOrigin();
  if (!origin) return relative;
  if (relative.startsWith(`${origin}/`) || relative === origin) return relative;
  return `${origin}${relative}`;
}
