import assert from "node:assert/strict";
import test from "node:test";
import {
  GEO_CACHE_KEY,
  GEO_SESSION_KEY,
  STORAGE_KEY,
  detectLanguageFromIp,
  getInitialLanguage,
  persistLanguage,
  resetGeoRequestForTests,
  shouldSkipIpDetection,
} from "../src/i18n/language.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test.beforeEach(() => {
  resetGeoRequestForTests();
});

test("does not fetch ipapi when the user already chose a language", async () => {
  const storage = memoryStorage();
  persistLanguage("vi", storage);
  let fetches = 0;
  const detected = await detectLanguageFromIp({
    fetchFn: async () => {
      fetches += 1;
      return jsonResponse(200, { country_code: "US" });
    },
    storage,
    sessionStorage: memoryStorage(),
  });
  assert.equal(detected, null);
  assert.equal(fetches, 0);
  assert.equal(getInitialLanguage({ storage }), "vi");
});

test("reuses a successful geo cache without calling ipapi", async () => {
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  let fetches = 0;
  const fetchFn = async () => {
    fetches += 1;
    return jsonResponse(200, { country_code: "VN" });
  };

  const first = await detectLanguageFromIp({ fetchFn, storage, sessionStorage });
  assert.equal(first, "vi");
  assert.equal(fetches, 1);

  resetGeoRequestForTests();
  const second = await detectLanguageFromIp({ fetchFn, storage, sessionStorage });
  assert.equal(second, "vi");
  assert.equal(fetches, 1);
});

test("caches a 429 so reload does not call ipapi again", async () => {
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  let fetches = 0;
  const fetchFn = async () => {
    fetches += 1;
    return jsonResponse(429, { error: true });
  };

  const first = await detectLanguageFromIp({ fetchFn, storage, sessionStorage });
  assert.equal(first, null);
  assert.equal(fetches, 1);
  assert.equal(sessionStorage.getItem(GEO_SESSION_KEY), "1");
  assert.ok(storage.getItem(GEO_CACHE_KEY));
  assert.equal(shouldSkipIpDetection({ storage, sessionStorage }), true);

  resetGeoRequestForTests();
  const second = await detectLanguageFromIp({ fetchFn, storage, sessionStorage });
  assert.equal(second, null);
  assert.equal(fetches, 1);
});

test("dedupes concurrent ip lookups", async () => {
  const storage = memoryStorage();
  const sessionStorage = memoryStorage();
  let fetches = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const fetchFn = async () => {
    fetches += 1;
    await gate;
    return jsonResponse(200, { country_code: "US" });
  };

  const pending = [
    detectLanguageFromIp({ fetchFn, storage, sessionStorage }),
    detectLanguageFromIp({ fetchFn, storage, sessionStorage }),
  ];
  release();
  const results = await Promise.all(pending);
  assert.deepEqual(results, ["en", "en"]);
  assert.equal(fetches, 1);
});

test("user language wins over a cached geo result", () => {
  const storage = memoryStorage({
    [GEO_CACHE_KEY]: JSON.stringify({
      status: "ok",
      language: "vi",
      expiresAt: Date.now() + 60_000,
    }),
  });
  persistLanguage("en", storage);
  assert.equal(getInitialLanguage({ storage }), "en");
});
