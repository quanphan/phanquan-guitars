import { isCustomBuildPath } from "./customBuildDraftResume.js";

export const CUSTOM_BUILD_RETURN_KEY = "phanquan-guitars-custom-build-return-v1";

export function isSafeReturnPath(path) {
  if (typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) return false;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) return false;
  if (isCustomBuildPath(trimmed)) return false;
  try {
    const url = new URL(trimmed, "https://phanquan.invalid");
    if (url.username || url.password) return false;
    return url.pathname.startsWith("/");
  } catch {
    return false;
  }
}

export function pathFromReferrer(referrer, origin) {
  if (!referrer || !origin) return "";
  try {
    const url = new URL(referrer);
    if (url.origin !== origin) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

export function resolveCustomBuildReturn(path) {
  return isSafeReturnPath(path) ? path : "/";
}

export function rememberCustomBuildReturn({
  fromState,
  referrer,
  origin,
  existing,
} = {}) {
  if (isSafeReturnPath(fromState)) return fromState;
  const fromReferrer = pathFromReferrer(referrer, origin);
  if (isSafeReturnPath(fromReferrer)) return fromReferrer;
  if (isSafeReturnPath(existing)) return existing;
  return "/";
}

export function readCustomBuildReturn(storage = globalThis.sessionStorage) {
  try {
    return resolveCustomBuildReturn(storage?.getItem(CUSTOM_BUILD_RETURN_KEY) || "");
  } catch {
    return "/";
  }
}

export function writeCustomBuildReturn(path, storage = globalThis.sessionStorage) {
  const next = resolveCustomBuildReturn(path);
  try {
    storage?.setItem(CUSTOM_BUILD_RETURN_KEY, next);
  } catch {
    // Ignore quota / private-mode failures.
  }
  return next;
}

export function clearCustomBuildReturn(storage = globalThis.sessionStorage) {
  try {
    storage?.removeItem(CUSTOM_BUILD_RETURN_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
