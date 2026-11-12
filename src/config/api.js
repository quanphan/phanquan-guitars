import { isDevelopmentApiEnv, resolveApiBaseUrl, resolveDevelopmentApiTarget, resolveMediaOrigin } from "./apiMode.js";

/**
 * API origin from Vite env. Never hard-code a production host here.
 *
 * In development JSON still uses relative `/api` (Vite proxy), while media
 * (`/uploads`) is resolved against the selected local or Railway origin.
 * Production builds only use VITE_API_BASE_URL (or an equivalent reverse proxy).
 */
export function getApiBaseUrl() {
  return resolveApiBaseUrl(import.meta.env);
}

export function isCustomBuildApiConfigured() {
  if (getApiBaseUrl()) return true;
  return Boolean(import.meta.env.DEV);
}

export function getGoogleClientId() {
  return String(import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? "").trim();
}

export function isGoogleSignInConfigured() {
  return Boolean(getGoogleClientId());
}

export function getApiOrigin() {
  return resolveMediaOrigin(import.meta.env ?? {});
}

function rewriteDevAbsoluteMedia(url, env) {
  if (!isDevelopmentApiEnv(env) || !/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/uploads/")) return url;
    const host = parsed.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "timbowebapi.up.railway.app") {
      return url;
    }
    return `${resolveDevelopmentApiTarget(env)}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
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
  if (/^https?:\/\//i.test(trimmed)) return rewriteDevAbsoluteMedia(trimmed, import.meta.env ?? {});
  const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const origin = getApiOrigin();
  if (!origin) return relative;
  if (relative.startsWith(`${origin}/`) || relative === origin) return relative;
  return `${origin}${relative}`;
}
