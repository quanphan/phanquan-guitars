import assert from "node:assert/strict";
import test from "node:test";
import {
  FALLBACK_FOOTER_LINKS,
  isInternalFooterPath,
  mergePublicFooterLinks,
} from "../src/data/footerQuickLinks.js";
import { tFor } from "../src/i18n/translations.js";
import { isHttpUrl } from "../src/services/brandSettings.js";

test("footer fallbacks keep Custom Build and Contact until Mongo has links", () => {
  assert.deepEqual(FALLBACK_FOOTER_LINKS.map((item) => item.url), ["/custom-build", "/contact"]);
  const empty = mergePublicFooterLinks([]);
  assert.equal(empty[0].titleKey, "footer.startBuild");
  assert.equal(tFor("en", "footer.startBuild"), "Start a custom build");
  assert.equal(tFor("vi", "footer.startBuild"), "Bắt đầu custom build");
  const fromApi = mergePublicFooterLinks([
    { url: "/gallery", sortOrder: 1, translations: { en: { title: "Gallery" } } },
    { url: "/contact", sortOrder: 0, translations: { en: { title: "Contact" } } },
  ]);
  assert.equal(fromApi[0].url, "/contact");
  assert.equal(fromApi.length, 2);
  assert.equal(tFor("en", "admin.tabs.footerLinks"), "Footer Links");
});

test("footer URLs accept internal paths and http(s) only", () => {
  assert.equal(isInternalFooterPath("/contact"), true);
  assert.equal(isInternalFooterPath("/custom-build?from=footer"), true);
  assert.equal(isInternalFooterPath("//evil.example"), false);
  assert.equal(isInternalFooterPath("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("https://instagram.com/phanquan"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
});
