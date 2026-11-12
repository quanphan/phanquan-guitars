import assert from "node:assert/strict";
import test from "node:test";
import { mediaUrl } from "../src/config/api.js";
import {
  DEFAULT_API_DEV_FALLBACK,
  DEFAULT_API_LOCAL,
  DEFAULT_API_RAILWAY,
  normalizeApiOrigin,
  resolveApiBaseUrl,
  resolveDevelopmentApiTarget,
  resolveMediaOrigin,
} from "../src/config/apiMode.js";

test("development proxy target follows VITE_API_MODE", () => {
  assert.equal(
    resolveDevelopmentApiTarget({ VITE_API_MODE: "local", VITE_API_LOCAL: "http://127.0.0.1:5050/" }),
    "http://127.0.0.1:5050",
  );
  assert.equal(
    resolveDevelopmentApiTarget({
      VITE_API_MODE: "railway",
      VITE_API_RAILWAY: "https://timbowebapi.up.railway.app/api",
    }),
    "https://timbowebapi.up.railway.app",
  );
  assert.equal(resolveDevelopmentApiTarget({ VITE_API_MODE: "local" }), DEFAULT_API_LOCAL);
  assert.equal(resolveDevelopmentApiTarget({ VITE_API_MODE: "railway" }), DEFAULT_API_RAILWAY);
  assert.equal(resolveDevelopmentApiTarget({}), DEFAULT_API_DEV_FALLBACK);
});

test("production API base ignores VITE_API_MODE", () => {
  assert.equal(
    resolveApiBaseUrl({
      DEV: false,
      MODE: "production",
      VITE_API_MODE: "railway",
      VITE_API_RAILWAY: "https://timbowebapi.up.railway.app",
      VITE_API_BASE_URL: "",
    }),
    "",
  );
  assert.equal(
    resolveApiBaseUrl({
      DEV: false,
      MODE: "production",
      VITE_API_MODE: "local",
      VITE_API_BASE_URL: "https://example.invalid/api/",
    }),
    "https://example.invalid/api",
  );
  assert.equal(
    resolveApiBaseUrl({
      DEV: true,
      MODE: "development",
      VITE_API_MODE: "railway",
      VITE_API_RAILWAY: "https://timbowebapi.up.railway.app",
    }),
    "",
  );
});

test("development media origin follows VITE_API_MODE while production stays relative", () => {
  assert.equal(
    resolveMediaOrigin({
      DEV: true,
      VITE_API_MODE: "railway",
      VITE_API_RAILWAY: "https://timbowebapi.up.railway.app",
    }),
    "https://timbowebapi.up.railway.app",
  );
  assert.equal(
    resolveMediaOrigin({
      DEV: true,
      VITE_API_MODE: "local",
      VITE_API_LOCAL: "http://127.0.0.1:5050",
    }),
    "http://127.0.0.1:5050",
  );
  assert.equal(
    resolveMediaOrigin({
      DEV: false,
      MODE: "production",
      VITE_API_MODE: "railway",
      VITE_API_BASE_URL: "",
    }),
    "",
  );
  assert.equal(normalizeApiOrigin("https://host.example/api/"), "https://host.example");
  assert.equal(mediaUrl("/uploads/guitars/front.jpg"), "/uploads/guitars/front.jpg");
  assert.equal(mediaUrl("https://cdn.example/photo.jpg"), "https://cdn.example/photo.jpg");
});
