export const STORAGE_KEY = "phanquan-guitars-language";
export const GEO_CACHE_KEY = "phanquan-guitars-geo-language";
export const GEO_SESSION_KEY = "phanquan-guitars-geo-attempted";
export const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const GEO_ERROR_TTL_MS = 6 * 60 * 60 * 1000;
export const GEO_ENDPOINT = "https://ipapi.co/json/";
export const GEO_TIMEOUT_MS = 4000;

let inflightGeoRequest = null;
let geoLookupSettled = false;

export function isLanguage(value) {
  return value === "en" || value === "vi";
}

export function getStoredLanguage(storage) {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

export function persistLanguage(language, storage = globalThis.localStorage) {
  if (!isLanguage(language)) return;
  try {
    storage?.setItem(STORAGE_KEY, language);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function countryToLanguage(countryCode) {
  if (typeof countryCode !== "string") return "en";
  return countryCode.trim().toUpperCase() === "VN" ? "vi" : "en";
}

function readGeoRecord(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.expiresAt !== "number") return null;
    const status = parsed.status === "unavailable" ? "unavailable" : "ok";
    const language = isLanguage(parsed.language) ? parsed.language : null;
    if (status === "ok" && !language) return null;
    return { status, language, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export function getCachedGeoLanguage(storage = globalThis.localStorage, now = Date.now()) {
  const record = readGeoRecord(storage);
  if (!record || record.expiresAt <= now || record.status !== "ok") return null;
  return record.language;
}

export function shouldSkipIpDetection({
  storage = globalThis.localStorage,
  sessionStorage = globalThis.sessionStorage,
  now = Date.now(),
} = {}) {
  if (geoLookupSettled) return true;
  if (getStoredLanguage(storage)) return true;
  try {
    if (sessionStorage?.getItem(GEO_SESSION_KEY) === "1") return true;
  } catch {
    // Ignore sessionStorage failures.
  }
  const record = readGeoRecord(storage);
  return Boolean(record && record.expiresAt > now);
}

export function persistGeoLanguage(
  language,
  storage = globalThis.localStorage,
  now = Date.now(),
) {
  if (!isLanguage(language)) return;
  writeGeoRecord(
    {
      status: "ok",
      language,
      expiresAt: now + GEO_CACHE_TTL_MS,
    },
    storage,
  );
}

function persistGeoUnavailable(storage = globalThis.localStorage, now = Date.now()) {
  const previous = readGeoRecord(storage);
  if (previous?.status === "ok" && isLanguage(previous.language)) {
    writeGeoRecord(
      {
        status: "ok",
        language: previous.language,
        expiresAt: Math.max(previous.expiresAt, now + GEO_ERROR_TTL_MS),
      },
      storage,
    );
    return;
  }
  writeGeoRecord(
    {
      status: "unavailable",
      language: null,
      expiresAt: now + GEO_ERROR_TTL_MS,
    },
    storage,
  );
}

function writeGeoRecord(record, storage = globalThis.localStorage) {
  try {
    storage?.setItem(GEO_CACHE_KEY, JSON.stringify(record));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function markGeoAttempted(sessionStorage = globalThis.sessionStorage) {
  geoLookupSettled = true;
  try {
    sessionStorage?.setItem(GEO_SESSION_KEY, "1");
  } catch {
    // Ignore sessionStorage failures.
  }
}

export function getInitialLanguage({
  storage = globalThis.localStorage,
} = {}) {
  return getStoredLanguage(storage) ?? getCachedGeoLanguage(storage) ?? "en";
}

export async function detectLanguageFromIp({
  fetchFn = globalThis.fetch,
  timeoutMs = GEO_TIMEOUT_MS,
  endpoint = GEO_ENDPOINT,
  storage = globalThis.localStorage,
  sessionStorage = globalThis.sessionStorage,
  now = Date.now(),
} = {}) {
  if (getStoredLanguage(storage)) {
    return null;
  }

  const cached = getCachedGeoLanguage(storage, now);
  if (cached) {
    markGeoAttempted(sessionStorage);
    return cached;
  }

  if (shouldSkipIpDetection({ storage, sessionStorage, now })) {
    return getCachedGeoLanguage(storage, now);
  }

  if (typeof fetchFn !== "function") {
    persistGeoUnavailable(storage, now);
    markGeoAttempted(sessionStorage);
    return null;
  }

  if (!inflightGeoRequest) {
    inflightGeoRequest = lookupCountryLanguage({
      fetchFn,
      timeoutMs,
      endpoint,
      storage,
      sessionStorage,
      now,
    }).finally(() => {
      inflightGeoRequest = null;
    });
  }

  return inflightGeoRequest;
}

async function lookupCountryLanguage({
  fetchFn,
  timeoutMs,
  endpoint,
  storage,
  sessionStorage,
  now,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(endpoint, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      persistGeoUnavailable(storage, now);
      return null;
    }

    const data = await response.json();
    if (!data || data.error) {
      persistGeoUnavailable(storage, now);
      return null;
    }

    const countryCode = data.country_code ?? data.country;
    if (typeof countryCode !== "string" || countryCode.trim() === "") {
      persistGeoUnavailable(storage, now);
      return null;
    }

    const language = countryToLanguage(countryCode);
    persistGeoLanguage(language, storage, now);
    return language;
  } catch {
    persistGeoUnavailable(storage, now);
    return null;
  } finally {
    markGeoAttempted(sessionStorage);
    clearTimeout(timer);
  }
}

export function resetGeoRequestForTests() {
  inflightGeoRequest = null;
  geoLookupSettled = false;
}
